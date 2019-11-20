import { Book } from './book';
export class PdfBook {
  private pages: Array<{ div: HTMLElement; width: number; height: number }> = [];

  private application: any;

  private viewer: any;

  private book = new Book();

  private spread: number; // spread page mode
  private isActive: boolean;

  public init(): void {
    this.application = (<any>window).PDFViewerApplication;
    this.application.eventBus.on('switchscrollmode', event => this.toggleBookMode(event));
    this.application.eventBus.on('pagechanging', event => { if (this.isActive) { this.openPage(event.pageNumber, event.pageLabel); }});
  }

  private toggleBookMode(event: any): void {
    console.log('toggle ' + event.mode);
    if (event.mode === 3) {
      this.startBookMode();
    } else {
      this.stopBookMode();
    }
  }

  private startBookMode(): void {
    this.isActive = true;
    // determine the dimensions
    const viewerContainerDiv = document.getElementById('viewerContainer') as HTMLElement;
    const width = viewerContainerDiv.clientWidth;
    const height = viewerContainerDiv.clientHeight;

    this.viewer = this.application.pdfViewer;
    const viewerDiv = document.getElementById('viewer') as HTMLElement;
    viewerDiv.classList.remove('pdfViewer');
    viewerContainerDiv.classList.add('book');
    const canvas = document.getElementsByClassName('pageflip-canvas')[0] as HTMLElement;
    canvas.classList.remove('invisible');
    this.pages = this.application.pdfViewer._pages;
    this.application.eventBus._listeners.switchspreadmode = null; // ???
    this.spread = 0;
    this.viewer.spreadMode = 0;
    this.viewer._spreadMode = -1;
    // const w = this.pages[this.currentPage].width;
    // const h = this.pages[this.currentPage].height;
    // const scaleX = width / w;
    // const scaleY = height / h;
    // const scale = Math.min(scaleY, scaleX);
    this.viewer.currentScaleValue = 'page-fit';
    //debugger;

    //    var scale = viewer.currentScale;
    //		var parent = this;
    //		$('#viewer .page').each(function(){
    //			parent._width[$(this).attr('data-page-number')] = $(this).width() / scale;
    //			parent._height[$(this).attr('data-page-number')] = $(this).height() / scale;
    //		});

    this.viewer.scrollPageIntoView = data => this.link(data);
    this.viewer._getVisiblePages = () => this.load();



    this.book.openBook(width, height, (page) => {this.application.page = page; console.log("Page:" + page); });
  }

  private openPage(pageNumber: number, pageLabel: string): void {
    this.book.openPage(pageNumber, pageLabel);
  }

  private stopBookMode(): void {
    this.isActive = false;
    const viewerDiv = document.getElementById('viewer') as HTMLDivElement;
    (viewerDiv.parentElement as HTMLElement).classList.remove('book');
    viewerDiv.classList.add('pdfViewer');
    (document.getElementsByClassName('pageflip-canvas')[0] as HTMLElement).classList.add('invisible');
    this.book.destroy();
  }

  private load(): { first: any; last: any; views: Array<any> } {
    // if(!this.active)return null;
    const views = this.application.pdfViewer._pages;
    const arr: Array<any> = [];
    const page = this.application.page;
    const min = Math.max(page - (this.spread === 0 ? 2 : 3 + (page % 2)), 0);
    const max = Math.min(page + (this.spread === 0 ? 1 : 3 - (page % 2)), views.length);

    for (let i = min, ii = max; i < ii; i++) {
      arr.push({
        id: views[i].id,
        view: views[i],
        x: 0,
        y: 0,
        percent: 100
      });
    }

    return { first: arr[page - min - 1], last: arr[arr.length - 1], views: arr };
  }

  public link(data: { pageNumber: number }): void {
    // if(!this.active)return;
    this.application.page = data.pageNumber;
  }
}
