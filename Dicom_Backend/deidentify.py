import sys,os
import os.path
import threading
import time
import json
import shutil
from pathlib import Path

Deidentifiedfolder = os.path.join(os.path.expanduser('~'),'Deidentified')
paths = []
Deidentifieddata = []
paths=eval(json.dumps(json.loads(sys.argv[1])))

for eachpath in paths:
	filesread = {}
	# time.sleep(10)
	pathtoparse = eachpath['PatientPath']
	sessionfolder = str(eachpath['SessionID'])
   	for subFolderRoot, foldersWithinSubFolder, files in os.walk(pathtoparse):
		individualfile = []
		deidentifiedfilepath = []
		deidentifiedfilename = []
		filesread['PatientPath'] = pathtoparse
		filesread['Deidentified_SessionID'] = sessionfolder
		filesread['Deidentified_Path'] = os.path.join(Deidentifiedfolder,sessionfolder)
		for fileName in files:
			individualfile.append(os.path.join(subFolderRoot,fileName))
			filesread['FilesPath'] = individualfile

			if not os.path.exists(Deidentifiedfolder):
				os.makedirs(Deidentifiedfolder)

			patientfolder = os.path.basename(os.path.dirname(os.path.join(subFolderRoot,fileName)))
			individualpatientfolder = os.path.join(Deidentifiedfolder,sessionfolder,'Deidentified_'+patientfolder)
			filesread['Deidentified_PatientPath'] = individualpatientfolder
			# individualpatientfolder = os.path.join(individualsessionfolder,'Deidentified_'+patientfolder)
			if not os.path.exists(individualpatientfolder):
				os.makedirs(individualpatientfolder)

			if os.path.exists(individualpatientfolder):
				shutil.copy(os.path.join(subFolderRoot,fileName), individualpatientfolder)
				deidentifiedfile = os.rename(individualpatientfolder+'/'+fileName,individualpatientfolder+'/'+'Deidentified_'+fileName)
				deidentifiedfilepath.append(individualpatientfolder+'/'+'Deidentified_'+fileName)
				deidentifiedfilename.append('Deidentified_'+fileName)
				filesread['deidentified_filepath'] = deidentifiedfilepath
				filesread['deidentified_filename'] = deidentifiedfilename
		# print(json.dumps(filesread))
		Deidentifieddata.append(filesread)
print(json.dumps(Deidentifieddata))