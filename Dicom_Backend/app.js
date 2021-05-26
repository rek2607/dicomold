const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const cors = require('cors')
const MongoClient = require('mongodb').MongoClient;

const { spawn } = require('child_process');

var dateFormat = require('dateformat');

var fs = require('fs');
const url = 'mongodb://127.0.0.1:27017/';
// Database Name
const dbName = 'PatientDetails';
const option = {
	useUnifiedTopology: true, 
	useNewUrlParser: true
};

const port = 3000
const app = express()

app.use(bodyParser.json());

app.use(cors());


app.get('/search', (req, res) => {
	var sdata = JSON.parse(req.query.data);
	var startdate = sdata.startdate;
	var enddate = sdata.enddate;
	var sourcename = sdata.sourcename;
	// console.log(startdate,enddate,sourcename)
	var query;
	if ((startdate != '' && startdate != undefined) && (enddate != '' && enddate != undefined) && (sourcename != '' && sourcename != undefined)) {
		query = {"UploadDate": { $gte: dateFormat(startdate, 'dd/mm/yyyy HH:MM'), $lte: dateFormat(enddate, 'dd/mm/yyyy HH:MM') },"SourceName": sourcename}
		getdata(query)
		
	}
	if ((startdate != '' && startdate != undefined) && (enddate != '' && enddate != undefined) && (sourcename == '' || sourcename == undefined)) {
		query = {"UploadDate": { $gte: dateFormat(startdate, 'dd/mm/yyyy HH:MM'), $lte: dateFormat(enddate, 'dd/mm/yyyy HH:MM') }}
		getdata(query)
	}
	if ((startdate != '' && startdate != undefined) && (enddate == '' || enddate == undefined) && (sourcename == '' || sourcename == undefined)) {
		query = {"UploadDate": { $gte: dateFormat(startdate, 'dd/mm/yyyy HH:MM') }}
		getdata(query)
	}
	if ((startdate == '' || startdate == undefined) && (enddate != '' && enddate != undefined) && (sourcename == '' || sourcename == undefined)) {
		query = {"UploadDate": { $lte: dateFormat(enddate, 'dd/mm/yyyy HH:MM') }}
		getdata(query)
	}
	if ((startdate != '' && startdate != undefined) && (enddate == '' || enddate == undefined) && (sourcename != '' && sourcename != undefined)) {
		query = {"UploadDate": { $gte: dateFormat(startdate, 'dd/mm/yyyy HH:MM') }, "SourceName": sourcename}
		getdata(query)
	}
	if ((startdate == '' || startdate == undefined) && (enddate != '' && enddate != undefined) && (sourcename != '' && sourcename != undefined)) {
		query = {"UploadDate": { $lte: dateFormat(enddate, 'dd/mm/yyyy HH:MM') }, "SourceName": sourcename}
		getdata(query)
	}
	if ((startdate == '' || startdate == undefined) && (enddate == '' || enddate == undefined) && (sourcename != '' && sourcename != undefined)) {
		query = { "SourceName": sourcename }
		getdata(query)
	}
	if ((startdate == '' || startdate == undefined) && (enddate == '' || enddate == undefined) && (sourcename == '' || sourcename == undefined)) {
		query = {}
		getdata(query)
	}
	function getdata(querydata) {

		MongoClient.connect(url,option, function(err, client) {
			if (err) throw err;
			// console.log("Connected successfully to server");
			const db = client.db(dbName);

			db.collection('session').find(querydata,{ "SourcePath": 0 }).toArray(function(err, data) {
				// console.log(querydata)
				if (err) {
					console.log(err);
				} else {
					// console.log(data);
					res.json(data);
				}
			});

		});
	}

});

app.post('/upload', (req, res) => {
	
	var filepath = req.body.filepath;
	var sourcename = req.body.sourcename;
	var destpath = req.body.destpath;
	var date = req.body.uploaddate;
	var uploaddate = date.replace(/,/g,'');
	
	var status = "Not Started"
	var patientpath = [];

	var myarray=[];
	var patientbulkdata = []
	var patientdetailsbulkdata = []

	walkDir(filepath, arrayOfFiles=[]);

	if(arrayOfFiles.length>0){
		arrayOfFiles.forEach(function(files){
			files.forEach(function(filepath){
				if (!patientpath.includes(path.parse(filepath).dir)) {
					patientpath.push(path.parse(filepath).dir)
				}
			})
		});
	}
	
	MongoClient.connect(url,option, function(err, client) {
		if (err) throw err;
	// console.log("Connected successfully to server");

	const db = client.db(dbName);
	var sessionid, patientid;
	
		uploadtodb();

	async function upload() {
		var idvals = await getids()
	       
		for (i = 0; i < patientpath.length; i++) {
			var patientobject = {}
			var patientdetailsobject = {}
			idvals.pid = idvals.pid + 1;
			patientobject['_id'] = idvals.pid;
			patientobject['SessionID'] = idvals.sid;
			patientobject['PatientPath'] = patientpath[i];
			patientobject['Deidentified_Status'] = "false";

			patientbulkdata.push({ insertOne: { "document": patientobject }})

			patientdetailsobject['SessionID'] = idvals.sid;
			patientdetailsobject['PatientID'] = idvals.pid;
			patientdetailsobject['FileName'] = filenamearray[i];
			patientdetailsobject['FilePath'] = arrayOfFiles[i];
			patientdetailsobject['Deidentified_Status'] = "false";

			patientdetailsbulkdata.push({ insertOne: { "document": patientdetailsobject }})
		}
		return new Promise(function(resolve, reject) {
			db.collection('session').insertOne({ _id: idvals.sid, SourcePath: filepath, SourceName: sourcename, UploadDate: uploaddate, Status: status })
			db.collection('patientdetails').bulkWrite(patientdetailsbulkdata, function(err, res) {
				if (err) throw err;
				// console.log("Inserted into patientdetails collection");
			});
			var patientdatatodb = db.collection('patient').bulkWrite(patientbulkdata)
			
			resolve(patientdatatodb)

		});
		
	}
	async function getids() {
		var pid = await getpatientid()
		return new Promise(function(resolve, reject) {
			db.collection('session').countDocuments({}).then((data) => {
				if (data == 0) {
					sessionid = 1;
					var ids ={
						sid:sessionid,
						pid:pid
					}
					resolve(ids)
				}
				else {
					db.collection('session').find({}).sort({ _id: -1 }).limit(1).forEach(function(data) {
						sessionid = data._id + 1;
						var ids = {
							sid:sessionid,
							pid:patientid
						}
						resolve(ids)
					});
				}
			});

		});
	}
	async function getpatientid() {
		return new Promise(function(resolve, reject) {
			db.collection('patient').countDocuments({}).then((data) => {
				if (data == 0) {
					patientid = 0;
					resolve(patientid)
				}
				else {
					db.collection('patient').find({}).sort({ _id: -1 }).limit(1).forEach(function(data) {
						patientid = data._id;
						resolve(patientid)

					});

				}
			});
		});
	}

	async function uploadtodb()
	{
		var insertedidvalues = await upload()
		var pids = []
		Object.keys(insertedidvalues.insertedIds).forEach(function(id) {
			pids.push(insertedidvalues.insertedIds[id]);
		});

		if (insertedidvalues) {
			res.send({ "data": "success" });
			console.log("Inserted to db");
			db.collection("patient").find({ "_id": { "$in": pids } }).toArray(function(err, data) {
					if (err) {
						console.log(err);
					} else {
						// console.log(data)
						calldeidentify(data)
					}
				});

		}
	}

	function calldeidentify(dbdata)
	{
		const process = spawn('python', ['./deidentify.py', JSON.stringify(dbdata)], {
				detached: true
		});
		let completeresult = '';
		process.stdout.on('data', (data) => {	
		
			completeresult += data;
			
		});
		process.stdout.on('end', () => {
			try {
			
				result = JSON.parse(completeresult);
				updateDBAfterCloudUpload(db, result);
				
			} catch (e) {
			
				console.log(e);
			}
		});
		process.stderr.on('data', (data) => {
			console.log(`${data}`)
		});
		process.on('exit', (code) => {
			// console.log("Process quit with code : " + code);
		});
		process.unref();
	}
		
	});

});

var arrayOfFiles = arrayOfFiles || []
var filenamearray = []

const walkDir = (dirPath, arrayOfFiles) => {
	files = fs.readdirSync(dirPath)
	individualarray = []
	filenames = []
	files.forEach(function(file) {
		if (fs.statSync(dirPath + "/" + file).isDirectory()) {
			arrayOfFiles = walkDir(dirPath + "/" + file, arrayOfFiles)
		} else {
			var filepath = path.join(dirPath, "/", file);
			individualarray.push(filepath)
			filenames.push(path.basename(filepath))
		}
	
	});

	if(!arrayOfFiles.includes(individualarray))
	{
		arrayOfFiles.push(individualarray);
	}
	if(!filenamearray.includes(filenames))
	{
		filenamearray.push(filenames)

	}
	return arrayOfFiles;
};

async function updatepatientandpatientdetails(result)
{
	return new Promise(function(resolve, reject) {
		var updatepatient;
		MongoClient.connect(url,option, function(err, client) {
			if (err) throw err;
			const db = client.db(dbName);
		
			result.forEach(function(data) {
				Object.keys(data).forEach(function(key) {

					db.collection('session').updateMany({ "_id": parseInt(data['Deidentified_SessionID']) }, 
						{ $set: { "Deidentified_Path": data['Deidentified_Path'] } })
					updatepatient = db.collection('patient').updateMany({ "PatientPath": data['PatientPath'] }, { $set: { "Deidentified_Status": "true", "Deidentified_PatientFolder": data['Deidentified_PatientPath'] } })
					var updatepatientdetails = db.collection('patientdetails').updateMany({ "FilePath": { "$all": data['FilesPath'] } },
						{ $set: { "Deidentified_Status": "true", "Deidentified_Path": data['deidentified_filepath'], "Deidentified_Filename": data['deidentified_filename'] } })

				});
			});
			resolve(updatepatient)

		});

	});
}

async function updatestatusofsession(result)
{

	updatedeidentifystatus_patient = await updatepatientandpatientdetails(result)

	if (updatedeidentifystatus_patient) {
		return new Promise(function(resolve, reject) {
			MongoClient.connect(url, option, function(err, client) {
				if (err) throw err;
				// console.log("Connected successfully to server");

				const db = client.db(dbName);

				var allsessionid = db.collection("session").find({ "Status": { "$in": ["Not Started", "In Progress"] } }, { "_id": 1, "SourceName": 0, "SourcePath": 0, "UploadDate": 0 });

				var getsessiontableupdatestatus = allsessionid.forEach(function(data) {
					db.collection('patient').aggregate([{ "$match": { "SessionID": data._id } }, { "$project": { "Deidentified_Status": "$Deidentified_Status", "SessionID": "$SessionID" } }]).toArray(function(err, data) {
						checkstatus = [];
						data.forEach(function(val) {
							Object.keys(val).forEach(function(key) {
								if (!checkstatus.includes(val['Deidentified_Status'])) {
									checkstatus.push(val['Deidentified_Status'])
								}
							});


							if (checkstatus.length == 2) {
								db.collection('session').updateOne({ "_id": val.SessionID }, { $set: { "Status": "In Progress" } })
							}
							if ((checkstatus.length == 1) && (checkstatus[0] == "true")) {
								db.collection('session').updateOne({ "_id": val.SessionID }, { $set: { "Status": "Completed" } })
							}
							if ((checkstatus.length == 1) && (checkstatus[0] == "false")) {
								db.collection('session').updateOne({ "_id": val.SessionID }, { $set: { "Status": "Not Started" } })

							}
						});
					});
				});
				resolve(getsessiontableupdatestatus)
				
			});
		});

	}
}



async function cloudUpload(db){

	return new Promise((resolve,reject)=>{
		setTimeout(()=>{
			db.collection('session').updateMany({"Status":"Completed"},{$set:{"Status":"Cloud Upload Completed"}})
			resolve(true);
		},30000)

	})
	
}

async function updateDBAfterCloudUpload(db,result) {
	let sessionstatus = await updatestatusofsession(result)
	let status = await cloudUpload(db)

	if (status) {
		let sessionList = await db.collection('session').find({ "Status": "Cloud Upload Completed" }).project({ _id: 1, SourcePath: 1, Deidentified_Path: 1 }).toArray();
		
		return new Promise((resolve, reject) => {
		
			sessionList.map((eachSession) => {
				
				let deidentifiedPath = eachSession.Deidentified_Path
				
				let baseName = path.basename(deidentifiedPath.toString());
				let patientFolders = fs.readdirSync(deidentifiedPath);

				patientFolders.map((eachPatient) => {
					db.collection('mappedPaths').insertOne({ SessionID: eachSession._id, SourcePath: eachSession.SourcePath, CloudPath: path.join(baseName, eachPatient) });
				});
			});
			db.collection('session').updateMany({ "Status": "Cloud Uplaod Completed" }, { $set: { "Status": "Process Finished" } });

			resolve(true)

		});
	}

}

app.listen(port, () => {
	console.log("Server connected to port" + port);
});