import {
  Component,
  AfterViewInit,
  ViewChildren,
  ElementRef,
  QueryList,
  NgZone,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReelsService } from '../reels.service';
import { take } from 'rxjs';

@Component({
  selector: 'app-reels',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reels.component.html',
  styleUrls: ['./reels.component.css'],
})
export class ReelsComponent implements AfterViewInit, OnDestroy {
  @ViewChildren('videoPlayer') videoPlayers!: QueryList<ElementRef<HTMLVideoElement>>;
  videos: string[] = [];
  currentIndex = 0;

  private offset = 0;
  private limit = 5;
  private isLoading = false;
  private observer!: IntersectionObserver;
  private wrapper: HTMLElement | null = null;

  private touchStartY = 0;
  private swipeThreshold = 50;
  private lastScrollTime = 0;

  constructor(private reelsService: ReelsService, private ngZone: NgZone) {}

  ngAfterViewInit() {
    this.loadVideos();
    this.wrapper = document.querySelector('.wrapper');
    if (this.wrapper) {
      this.wrapper.addEventListener('wheel', this.handleWheel, { passive: false });
      this.wrapper.addEventListener('touchstart', this.handleTouchStart);
      this.wrapper.addEventListener('touchend', this.handleTouchEnd);
    }
    this.setupIntersectionObserver();
  }

  loadVideos() {
    if (this.isLoading) return;
    this.isLoading = true;

    this.reelsService.getReels(this.offset, this.limit).subscribe(res => {
      const newVideos = res.videosUrls.map(v => v.Videourl);
      this.videos = [...this.videos, ...newVideos];
      this.offset += this.limit;
      this.isLoading = false;

      this.ngZone.onStable.pipe(take(1)).subscribe(() => {
        this.observeNewVideos();
      });
    });
  }

  private observeNewVideos() {
    const vpArray = this.videoPlayers.toArray();
    for (let i = Math.max(0, this.offset - this.limit); i < this.offset; i++) {
      const vp = vpArray[i];
      if (vp) {
        this.observer.observe(vp.nativeElement);
      }
    }
  }

  private setupIntersectionObserver() {
  if (this.observer) this.observer.disconnect();

  this.observer = new IntersectionObserver(entries => {
    // Filter entries which are intersecting enough (>= 0.75)
    const visibleEntries = entries.filter(e => e.isIntersecting && e.intersectionRatio >= 0.75);

    if (visibleEntries.length > 0) {
      // Pick the video with the highest intersection ratio
      const bestEntry = visibleEntries.reduce((a, b) => (a.intersectionRatio > b.intersectionRatio ? a : b));
      const videoToPlay = bestEntry.target as HTMLVideoElement;

      // Play the chosen video
      videoToPlay.play().catch(() => {});

      // Find its index and update currentIndex
      const index = this.videoPlayers.toArray().findIndex(vp => vp.nativeElement === videoToPlay);
      this.setCurrentIndex(index);

      // Pause all other videos except the best visible one
      this.videoPlayers.forEach(vp => {
        const vid = vp.nativeElement;
        if (vid !== videoToPlay) {
          vid.pause();
        }
      });

      // Load more videos if near the end
      if (index === this.videos.length - 3) {
        this.loadVideos();
      }
    } else {
      // No video sufficiently visible — 
      // Instead of pausing all videos (which pauses current video),
      // keep current video playing if it exists and is in DOM.
      const currentVideo = this.videoPlayers.toArray()[this.currentIndex]?.nativeElement;
      if (currentVideo) {
        // Check if current video is paused, if yes, play it
        if (currentVideo.paused) {
          currentVideo.play().catch(() => {});
        }
        // Pause other videos except current
        this.videoPlayers.forEach(vp => {
          const vid = vp.nativeElement;
          if (vid !== currentVideo) {
            vid.pause();
          }
        });
      }
      // If no current video (should not happen), you can decide to pause all or nothing
    }
  }, { threshold: 0.75 });
}


  ngOnDestroy() {
    if (this.wrapper) {
      this.wrapper.removeEventListener('wheel', this.handleWheel);
      this.wrapper.removeEventListener('touchstart', this.handleTouchStart);
      this.wrapper.removeEventListener('touchend', this.handleTouchEnd);
    }
    this.observer.disconnect();
  }

  private handleWheel = (event: WheelEvent) => {
    const now = Date.now();
    if (now - this.lastScrollTime < 700) return;
    this.lastScrollTime = now;

    event.preventDefault();
    event.deltaY > 0 ? this.nextVideo() : this.prevVideo();
  };

  private handleTouchStart = (event: TouchEvent) => {
    this.touchStartY = event.changedTouches[0].clientY;
  };

  private handleTouchEnd = (event: TouchEvent) => {
    const deltaY = event.changedTouches[0].clientY - this.touchStartY;
    if (Math.abs(deltaY) > this.swipeThreshold) {
      deltaY < 0 ? this.nextVideo() : this.prevVideo();
    }
  };

  nextVideo() {
    if (this.currentIndex < this.videos.length - 1) {
      this.currentIndex++;
      this.scrollToCurrentVideo();
    }
  }

  prevVideo() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.scrollToCurrentVideo();
    }
  }

  // scrollToCurrentVideo() {
  //   const el = this.videoPlayers.toArray()[this.currentIndex]?.nativeElement;
  //   if (el) {
  //     el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  //     el.muted = true;
  //     el.play().catch(() => {});
  //   }
  // }

  scrollToCurrentVideo() {
  const vpArray = this.videoPlayers.toArray();
  vpArray.forEach((vp, i) => {
    const video = vp.nativeElement;
    if (i === this.currentIndex) {
      video.muted = false; // unmute current video
      video.play().catch(() => {});
    } else {
      video.muted = true; // mute others
      video.pause();
    }
  });

  const el = vpArray[this.currentIndex]?.nativeElement;
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}


  setCurrentIndex(index: number) {
    if (index >= 0 && index < this.videos.length) {
      this.currentIndex = index;
    }
  }

  togglePlay(index: number) {
  const video = this.videoPlayers.toArray()[index]?.nativeElement;
  if (!video) return;

  if (video.paused) {
    video.play().catch(() => {});
  } else {
    video.pause();
  }
}

}
