export class PdfBook {
  private pages: Array<{div: HTMLElement}> = [];

  private currentPage = 1;

  private application: any;

  public init(): void {
    console.log('Added');
    this.application = (<any>window).PDFViewerApplication;
    this.application.eventBus.on('switchscrollmode', event => this.toggleBookMode(event));
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
    const viewerDiv = document.getElementById('viewer') as HTMLElement;
    viewerDiv.classList.remove('pdfViewer');
    viewerDiv.classList.add('bookViewer');
    this.pages = this.application.pdfViewer._pages;
    this.currentPage = this.application.page;
  }

  private stopBookMode(): void {
    const viewerDiv = document.getElementById('viewer') as HTMLElement;
    viewerDiv.classList.remove('bookViewer');
    viewerDiv.classList.add('pdfViewer');
  }
}
