import { Component, ViewEncapsulation } from '@angular/core';
import { Dropdown, Collapse, Tooltip } from 'bootstrap';

declare var bootstrap: any;

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css',
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
export class SidebarComponent {

ngAfterViewInit(): void {
  if (typeof window !== 'undefined') {
    // Dropdowns
    const dropdownTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="dropdown"]'));
    dropdownTriggerList.map(function (dropdownToggleEl) {
      return new bootstrap.Dropdown(dropdownToggleEl);
    });

    // Collapses (Sidebar submenus)
    const collapseTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="collapse"]'));
    collapseTriggerList.map(function (collapseToggleEl) {
      return new bootstrap.Collapse(collapseToggleEl, {
        toggle: false, // prevent auto-toggle on page load
      });
    });

    // Tooltips (if you use them)
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }
}


}
