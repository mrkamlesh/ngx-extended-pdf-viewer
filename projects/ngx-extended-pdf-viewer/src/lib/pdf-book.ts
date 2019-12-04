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

  private originalScrollPageIntoView: any = null;
  private originalGetVisiblePages: any = null;

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
    if (this.isActive) {
      return;
    }
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
    )[0] as HTMLCanvasElement;
    canvas.classList.remove('invisible');
    this.pages = this.application.pdfViewer._pages;
    this.application.eventBus._listeners.switchspreadmode = null; // ???
    this.spread = 0;
    this.viewer.spreadMode = 0;
    this.viewer._spreadMode = -1;
    // this.viewer.currentScaleValue = 'page-fit';

    this.originalGetVisiblePages = this.viewer._getVisiblePages;
    this.originalScrollPageIntoView = this.viewer.scrollPageIntoView;
    this.viewer.scrollPageIntoView = data => this.link(data);
    this.viewer._getVisiblePages = () => this.load();

    const { width, height, paddingLeft, paddingTop } = this.getPageDimensions();
    const menu = (viewerContainerDiv.parentElement as HTMLElement).getElementsByClassName('toolbar');
    const menuHeight = menu[0].clientHeight;

    const availableWidth =
      (viewerContainerDiv.parentElement as HTMLElement).clientWidth - paddingLeft * 2;
    const availableHeight =
      (viewerContainerDiv.parentElement as HTMLElement).clientHeight - menuHeight - paddingTop * 2;

    const distance = 0.1; // distance between left and right page
    const scaleX = availableWidth / width;
    const scaleY = availableHeight / height;
    const scale = Math.min(scaleX, scaleY);
    this.viewer.currentScaleValue =     this.viewer.currentScaleValue * scale;
    const pageWidth = Math.floor(scale * width);
    const pageHeight = Math.floor(scale * height);
    const bookWidth  = 2 * (pageWidth * (1 + distance));
    const bookHeight = availableHeight;
    const containerWidth = bookWidth - 5; // why -10?
    const containerHeight = bookHeight + 2 * paddingTop;
    viewerContainerDiv.style.backgroundSize = `${containerWidth}px ${containerHeight}px`;
    viewerContainerDiv.style.width = containerWidth + 'px';
    viewerContainerDiv.style.height = containerHeight + 'px';
    canvas.width = (bookWidth - 2 * paddingLeft - 10);
    canvas.height = bookHeight;
    canvas.style.left = paddingLeft + 'px';
    canvas.style.top = paddingTop + 'px';

    setTimeout(() => this.book.openBook(bookWidth, bookHeight, pageWidth, pageHeight,
      paddingLeft, paddingTop, Math.floor(distance * pageWidth / 2), page => (this.application.page = page)));
  }

  private openPage(pageNumber: number, pageLabel: string): void {
    this.book.openPage(pageNumber, pageLabel);
  }

  private stopBookMode(): void {
    if (this.isActive) {
      this.isActive = false;

      this.viewer._getVisiblePages = this.originalGetVisiblePages;
      this.viewer.scrollPageIntoView = this.originalScrollPageIntoView;

      const viewerDiv = document.getElementById('viewer') as HTMLDivElement;
      (viewerDiv.parentElement as HTMLElement).classList.remove('book');
      viewerDiv.classList.add('pdfViewer');
      (document.getElementsByClassName(
        'pageflip-canvas'
      )[0] as HTMLElement).classList.add('invisible');
      const viewerContainer = viewerDiv.parentElement as HTMLDivElement;
      viewerContainer.style.background = '';
      viewerContainer.style.width = '';
      viewerContainer.style.height = '';
      if (this.pages) {
        this.pages.forEach(p => {
          p.div.style.left = '';
          p.div.style.zIndex = '';
          p.div.style.width = '';
        });
      }
      this.viewer.currentScaleValue = 'auto';

      this.book.destroy();
    }
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

  private getPageDimensions(): { width: number; height: number, paddingLeft: number; paddingTop: number } {
    // if(!this.active)return null;
    const views = this.application.pdfViewer._pages;

    let width = 0;
    let height = 0;
    let paddingLeft = 15;
    let paddingTop = 10;

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
      console.log("todo: extract padding from CSS");
      // const w = (this.pages[0] as HTMLElement).clientWidth;
      // const h = (this.pages[0] as HTMLElement).clientHeight;

    }

    return { width, height, paddingLeft, paddingTop };
  }

  public link(data: { pageNumber: number }): void {
    // if(!this.active)return;
    this.application.page = data.pageNumber;
  }
}
