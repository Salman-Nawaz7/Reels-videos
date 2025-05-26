import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ReelsService {
  constructor(private http: HttpClient) {}

  // getReels() {
  //   return this.http.get<{ videosUrls: { Videourl: string }[] }>(
  //     'http://localhost:3000/reels/list'
  //   );
  // }

  getReels(offset = 0, limit = 5) {
  return this.http.get<{ videosUrls: { Videourl: string }[] }>(
    `http://localhost:3000/reels/list?offset=${offset}&limit=${limit}`
  );
}

}
