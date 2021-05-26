import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

@Injectable({
	providedIn: 'root'
})
export class SearchService {

	constructor(private http: HttpClient) { }

	searchdata(data) {
		let headers = new HttpHeaders();
		let params = new HttpParams();
		headers.append('content-Type', 'application/json');
		params.append('data', data);
		return this.http.post('http://localhost:3000/search', data);

	}
}