import { AfterViewInit, Component, ViewEncapsulation } from '@angular/core';
import Swiper from 'swiper';
import 'swiper/swiper-bundle.css'; // optional if already handled via your CSS imports


@Component({
  selector: 'app-swiper',
  standalone: true,
  imports: [],
  templateUrl: './swiper.component.html',
  styleUrls: ['./swiper.component.css',
  ],
  encapsulation: ViewEncapsulation.None,
  
})
export class SwiperComponent implements AfterViewInit {

ngAfterViewInit(): void {
    new Swiper('.mySwiper', {
      slidesPerView: 1,
      spaceBetween: 20,
      loop: true,
      autoplay: {
        delay: 3000,
        disableOnInteraction: false,
      },
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
      },
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
    });
  }

}
