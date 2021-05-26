import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
// import { SearchService } from '../search.service'
import { HttpClient,HttpParams } from '@angular/common/http';
import $ from "jquery";
@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit {

  constructor(private http:HttpClient) { }

  ngOnInit() {
  }
  search(data:NgForm){
	  let params = new HttpParams();
	  params = params.append("data",JSON.stringify(data.value))

	  this.http.get('http://localhost:3000/search',{params:params}).subscribe(
    	data => {
        if (Object.keys(data).length == 0) {

          $('#sessionresult').html('');
          $('#searchresult').hide();
          alert("No Records Found!!!");

        }
        else {
          $('#searchresult').show();
          $('#sessionresult').html('');
          // $('#selectall').prop('checked', false);
       
      for (var i = 0; i < Object.keys(data).length; i++) {

            var border;

            if (data[i].Status == "Not Started") {
              border = "15px solid #000000"
            }
            if (data[i].Status == "In Progress" || data[i].Status=="Completed") {
              border = "15px solid #ffff00"
            }
            if (data[i].Status == "Cloud Upload Completed") {
              border = "15px solid #00ff00"
            }

            $('#sessionresult').append('<div class="col-sm-3 session" style="margin-bottom:1%"><div class="card bg-dark text-white" style="border-left:' + border + '"><div class="card-body"><div class="vertical"><p>UploadDate :' + data[i].UploadDate + '</p><p>From : ' + data[i].SourceName + '</p></div></div></div>');

          }
        }
    	},
    	error => {
			console.log(error);
    	}
   		);

  	}

}
