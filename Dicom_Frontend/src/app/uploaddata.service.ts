import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class UploaddataService {

  constructor(private http:HttpClient) { }

  uploaddata(data){
    let headers = new HttpHeaders();
    headers.append('content-Type','application/json');
    return this.http.post('http://localhost:3000/upload',data,{headers:headers})
  }

}
