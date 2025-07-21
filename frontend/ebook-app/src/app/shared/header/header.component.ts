import { AfterViewInit, Component, Inject, PLATFORM_ID, ViewEncapsulation } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { Dropdown } from 'bootstrap';

declare var bootstrap: any;

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css',
    '../../../assets/css/booksto.min.css',
    '../../../assets/css/custom.min.css',
    '../../../assets/css/customizer.min.css',
    '../../../assets/css/flaticon.css',
    '../../../assets/css/font-awesome.min.css',
    '../../../assets/css/ionicons.min.css',
    '../../../assets/css/line-awesome.min.css',
    '../../../assets/css/libs.min.css',
    '../../../assets/css/remixicon.css',
    '../../../assets/css/style.css',
    '../../../assets/css/rtl.min.css',
    '../../../assets/css/style_1.css',
    '../../../assets/css/style_2.css',
    '../../../assets/css/webfont.css'
  ],
    encapsulation: ViewEncapsulation.None,

})
export class HeaderComponent implements AfterViewInit {
  ngAfterViewInit(): void {
    if (typeof window !== 'undefined') {
      const dropdownTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="dropdown"]'));
      dropdownTriggerList.map(function (dropdownToggleEl) {
        return new bootstrap.Dropdown(dropdownToggleEl);
      });
    }
  }
}
