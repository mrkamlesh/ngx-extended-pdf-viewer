import { Component, OnInit, ViewEncapsulation, Input, OnChanges, SimpleChanges } from '@angular/core';

declare var PDFJS: any;

@Component({
  selector: 'ngx-extended-pdf-viewer',
  templateUrl: './ngx-extended-pdf-viewer.component.html',
  styleUrls: ['./viewer-with-images.css', './ngx-extended-pdf-viewer.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class NgxExtendedPdfViewerComponent implements OnInit, OnChanges {
  private _src: string;

  private initialized = false;

  @Input()
  public set src(url: string) {
    this._src = url;
  }

  constructor() {}

  ngOnInit() {
    // This initializes the webviewer, the file may be passed in to it to initialize the viewer with a pdf directly
    PDFJS.webViewerLoad();
    (<any>window).workerSrc = 'pdf.worker.js';

    // open a file in the viewer
    if (!!this._src) {
      (<any>window).PDFViewerApplication.open(this._src);
    }
    this.initialized = true;
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (this.initialized) {
      if ('src' in changes) {
        if (!!this._src) {
          (<any>window).PDFViewerApplication.open(this._src);
        }
      }
    }
  }
}