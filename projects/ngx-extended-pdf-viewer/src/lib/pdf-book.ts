import { Book } from './book';
export class PdfBook {
  private pages: Array<{
    div: HTMLElement;
    width: number;
    height: number;
  }> = [];

  private application: any;

  private viewer: any;

  private book = new Book();

  private spread: number; // spread page mode
  private isActive: boolean;

  public init(): void {
    this.application = (<any>window).PDFViewerApplication;
    this.viewer = this.application.pdfViewer;
    this.application.eventBus.on('switchscrollmode', event =>
      this.toggleBookMode(event)
    );
    this.application.eventBus.on('pagechanging', event => {
      if (this.isActive) {
        this.openPage(event.pageNumber, event.pageLabel);
      }
    });
  }

  private toggleBookMode(event: any): void {
    console.log('toggle ' + event.mode);
    if (event.mode === 3) {
      this.viewer.currentScaleValue = 1;
      setTimeout(() => this.startBookMode());
    } else {
      this.stopBookMode();
    }
  }

  private startBookMode(): void {
    this.isActive = true;
    // determine the dimensions
    const viewerContainerDiv = document.getElementById(
      'viewerContainer'
    ) as HTMLElement;

    this.viewer = this.application.pdfViewer;
    const viewerDiv = document.getElementById('viewer') as HTMLElement;
    viewerDiv.classList.remove('pdfViewer');
    viewerContainerDiv.classList.add('book');
    const canvas = document.getElementsByClassName(
      'pageflip-canvas'
    )[0] as HTMLElement;
    canvas.classList.remove('invisible');
    this.pages = this.application.pdfViewer._pages;
    this.application.eventBus._listeners.switchspreadmode = null; // ???
    this.spread = 0;
    this.viewer.spreadMode = 0;
    this.viewer._spreadMode = -1;
    // this.viewer.currentScaleValue = 'page-fit';

    this.viewer.scrollPageIntoView = data => this.link(data);
    this.viewer._getVisiblePages = () => this.load();

    const { width, height } = this.getPageDimensions();
    const availableWidth =
      viewerContainerDiv.clientWidth - this.book.CANVAS_PADDING * 2;
    const availableHeight =
      viewerContainerDiv.clientHeight - 20;

    const scaleX = availableWidth / width;
    const scaleY = availableHeight / height;
    const scale = Math.min(scaleX, scaleY);
    this.viewer.currentScaleValue =     this.viewer.currentScaleValue * scale;
    const bx  = (scale * (width * 2) + this.book.CANVAS_PADDING * 2) + 'px';
    const by = (scale * height + 20) + 'px';
    viewerContainerDiv.style.backgroundSize = `${bx} ${by}`;
    viewerContainerDiv.style.width = (scale * (width * 2) + this.book.CANVAS_PADDING * 2) + 'px';
    viewerContainerDiv.style.height = (scale * height + 30) + 'px';
    canvas.style.width = bx;
    canvas.style.height = by;
    setTimeout(() => this.book.openBook(width, height, page => (this.application.page = page)));
  }

  private openPage(pageNumber: number, pageLabel: string): void {
    this.book.openPage(pageNumber, pageLabel);
  }

  private stopBookMode(): void {
    this.isActive = false;
    const viewerDiv = document.getElementById('viewer') as HTMLDivElement;
    (viewerDiv.parentElement as HTMLElement).classList.remove('book');
    viewerDiv.classList.add('pdfViewer');
    (document.getElementsByClassName(
      'pageflip-canvas'
    )[0] as HTMLElement).classList.add('invisible');
    this.book.destroy();
  }

  private load(): { first: any; last: any; views: Array<any> } {
    // if(!this.active)return null;
    const views = this.application.pdfViewer._pages;
    const arr: Array<any> = [];
    const page = this.application.page;
    const min = Math.max(page - (this.spread === 0 ? 2 : 3 + (page % 2)), 0);
    const max = Math.min(
      page + (this.spread === 0 ? 1 : 3 - (page % 2)),
      views.length
    );

    for (let i = min, ii = max; i < ii; i++) {
      arr.push({
        id: views[i].id,
        view: views[i],
        x: 0,
        y: 0,
        percent: 100
      });
    }

    return {
      first: arr[page - min - 1],
      last: arr[arr.length - 1],
      views: arr
    };
  }

  private getPageDimensions(): { width: number; height: number } {
    // if(!this.active)return null;
    const views = this.application.pdfViewer._pages;

    let width = 0;
    let height = 0;

    for (const v of views) {
      if (v.viewport.width > width) {
        width = v.viewport.width;
      } else {
        width = v.viewport.width;
      }
      if (v.viewport.height > height) {
        height = v.viewport.height;
      } else {
        height = v.viewport.height;
      }
    }

    return { width, height };
  }

  public link(data: { pageNumber: number }): void {
    // if(!this.active)return;
    this.application.page = data.pageNumber;
  }
}
