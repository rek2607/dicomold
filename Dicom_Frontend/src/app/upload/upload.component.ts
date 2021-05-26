import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { UploaddataService } from '../uploaddata.service'
import { RouterLink, Router } from '@angular/router';
import $ from "jquery";

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent implements OnInit {
  
  fileToUpload:File = null;
  pathname:any;
  formdata = {}
  uploaddate:String;
  constructor(private api:UploaddataService,private router:Router) {
    setInterval(() => {         
      let currentDate=new Date();
      this.uploaddate = currentDate.toLocaleString();
    }, 1000);
   }

  ngOnInit() {
  }
  upload(data:NgForm){
    this.formdata = data.value

    $(".loader").css("display", "block");
    $(".content").css("display", "none");
    if (data.form.status == "VALID")
    {
      data.form.reset()
    }
    console.log(this.formdata)

    this.api.uploaddata(this.formdata).subscribe(
      data => {
      $(".loader").css("display", "none");
      $(".content").css("display", "block");
        // this.router.navigate(['search'])
        // window.location.reload()
      },
      error => {
        console.log(error)
      }
    )
  }
  onChange(files: FileList) {
    this.fileToUpload = files.item(0);
    console.log(this.fileToUpload.name)
    var reader = new FileReader();
	  reader.onload = function(progressEvent){
	    // Entire file
      console.log(this.result);

	    // By lines
	    // var lines = (<string>reader.result).split('\n');
	    // for(var line = 0; line < lines.length; line++){
	    //   console.log(lines[line]);
	    //   if(lines[line].length>0)
	    //   {
	    //     this.paths.push(lines[line])

	    //   } 
	    // }
	  };
	  reader.readAsText(this.fileToUpload);

   
  }

}
