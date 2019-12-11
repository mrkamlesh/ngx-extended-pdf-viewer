interface PageFlipState {
  // Current progress of the flip (left -1 to right +1)
  progress: number;
  // progress during last rendering
  lastProgress: number;
  // The page DOM element related to this flip
  page: HTMLElement;
  // The target value towards which progress is always moving
  target: number;
  // True while the page is being dragged
  dragging: boolean;
  // width of the page
  pageWidth: number;
}

export class Book {
  // Dimensions of the whole book
  private BOOK_WIDTH = 830;

  // Dimensions of one page in the book
  private PAGE_WIDTH = 400;
  private PAGE_HEIGHT = 250;

  // The canvas size equals to the book dimensions + this padding
  // public CANVAS_PADDING = 60;

  public DISTANCE_BETWEEN_PAGES = 30;
  public PADDING_LEFT = 15;
  public PADDING_TOP = 10;

  private page = 0;
  private pageLabel: string | undefined = undefined;

  private mouseClickTime = 0;

  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;

  private mouse = { x: 0, y: 0 };

  private startedMousemovementOnTheRightHandSide: boolean;

  private watchingMouseMovements = false;

  private flips: Array<PageFlipState> = [];

  private book: HTMLElement;

  // List of all the page elements in the DOM
  private pages: HTMLCollection;

  private mouseMoveHandlerClosure: (
    this: HTMLElement,
    ev: MouseEvent
  ) => any = event => this.mouseMoveHandler(event)
  private mouseDownHandlerClosure: (
    this: HTMLElement,
    ev: MouseEvent
  ) => any = event => this.mouseDownHandler(event)
  private mouseUpHandlerClosure: (
    this: HTMLElement,
    ev: MouseEvent
  ) => any = event => this.mouseUpHandler(event)
  private mouseLeaveHandlerClosure: (
    this: HTMLElement,
    ev: MouseEvent
  ) => any = event => this.mouseLeaveHandler(event)
  private pageTurnCallback: (newPage) => void = () => { };

  constructor() { }

  public destroy() {
    console.log('TODO: destroy the book');
    if (this.book) {
      (this.book.parentElement as HTMLElement).removeEventListener(
        'mousemove',
        this.mouseMoveHandlerClosure,
        false
      );
      (this.book.parentElement as HTMLElement).removeEventListener(
        'mousedown',
        this.mouseDownHandlerClosure,
        false
      );
      (this.book.parentElement as HTMLElement).removeEventListener(
        'mouseup',
        this.mouseUpHandlerClosure,
        false
      );
      (this.book.parentElement as HTMLElement).removeEventListener(
        'mouseleave',
        this.mouseLeaveHandlerClosure,
        false
      );
    }
  }

  public openBook(
    availableBookWidth: number,
    availableBookHeight: number,
    pageWidth: number,
    pageHeight: number,
    paddingLeft: number,
    paddingTop: number,
    distanceBetweenPages: number,
    page: number,
    pageLabel,
    pageTurnCallback: (newPage: number) => void
  ): void {
    this.pageTurnCallback = pageTurnCallback;
    this.BOOK_WIDTH = availableBookWidth;
    // this.BOOK_HEIGHT = availableBookHeight;
    this.PAGE_WIDTH = pageWidth;
    this.PAGE_HEIGHT = pageHeight;
    this.DISTANCE_BETWEEN_PAGES = distanceBetweenPages;
    this.PADDING_LEFT = paddingLeft;
    this.PADDING_TOP = paddingTop;
    this.page = page;
    this.pageLabel = pageLabel;
    this.book = document.getElementById('viewer') as HTMLElement;
    this.pages = this.book.getElementsByClassName('page');
    this.canvas = document.getElementsByClassName(
      'pageflip-canvas'
    )[0] as HTMLCanvasElement;
    this.context = this.canvas.getContext('2d') as CanvasRenderingContext2D;

    // Organize the depth of our pages and create the flip definitions
    for (let i = 0, len = this.pages.length; i < len; i++) {
      (this.pages[i] as HTMLElement).style.zIndex = (len - i).toString();
      const center = this.PADDING_LEFT + this.PAGE_WIDTH + this.DISTANCE_BETWEEN_PAGES / 2;
      if (i % 2 === 0) {
        (this.pages[i] as HTMLElement).style.left = `${center - distanceBetweenPages / 2 - this.PAGE_WIDTH}px`;
      } else {
        (this.pages[i] as HTMLElement).style.left = `${center + distanceBetweenPages / 2}px`;
      }

      this.flips.push({
        // Current progress of the flip (left -1 to right +1)
        progress: 1,
        // progress during last rendering
        lastProgress: 1,
        // The target value towards which progress is always moving
        target: 1,
        // The page DOM element related to this flip
        page: this.pages[i] as HTMLElement,
        // True while the page is being dragged
        dragging: false,
        pageWidth: this.pages[i].clientWidth
      });
    }

    (this.book.parentElement as HTMLElement).addEventListener(
      'mousemove',
      this.mouseMoveHandlerClosure,
      false
    );
    (this.book.parentElement as HTMLElement).addEventListener(
      'mousedown',
      this.mouseDownHandlerClosure,
      false
    );
    (this.book.parentElement as HTMLElement).addEventListener(
      'mouseup',
      this.mouseUpHandlerClosure,
      false
    );
    (this.book.parentElement as HTMLElement).addEventListener(
      'mouseleave',
      this.mouseLeaveHandlerClosure,
      false
    );

    // Render the page flip 60 times a second
    setInterval(() => this.render(), 1000 / 60);
    this.openPage(this.page, this.pageLabel);

  }

  private mouseMoveHandler(event: MouseEvent): void {
    // Offset mouse position so that the top of the book spine is 0,0
    const rect = this.book.getBoundingClientRect();
    this.mouse.x =
      event.clientX - rect.left  - this.book.clientWidth / 2;
    this.mouse.y = event.clientY - this.book.offsetTop;
  }

  private mouseDownHandler(event: MouseEvent) {
    // Make sure the mouse pointer is inside of the book
    this.mouseClickTime = new Date().getTime();
    const rect = this.book.getBoundingClientRect();
    const initialX =
      event.clientX - rect.left  - this.book.clientWidth / 2;

    this.startedMousemovementOnTheRightHandSide = initialX > 0;
    this.watchingMouseMovements = true;

    if (Math.abs(this.mouse.x) < this.BOOK_WIDTH / 2) {
      if (this.mouse.x < 0 && this.page - 1 >= 0) {
        // We are on the left side, drag the previous page
        this.flips[this.page - 1].dragging = true;
      } else if (this.mouse.x > 0 && this.page + 1 < this.flips.length) {
        // We are on the right side, drag the current page
        this.flips[this.page].dragging = true;
      }
    }

    // Prevents the text selection
    event.preventDefault();
  }

  private mouseLeaveHandler(event: MouseEvent): void {
    if (this.watchingMouseMovements) {
      this.mouseUpHandler(event);
    }
  }

  private mouseUpHandler(event: MouseEvent): void {
    this.watchingMouseMovements = false;
    let click = false;
    if (new Date().getTime() - this.mouseClickTime < 500) {
      click = true;
    }
    let stayOnPage = false;
    if (!click) {
      if (this.startedMousemovementOnTheRightHandSide && this.mouse.x >= 0) {
        stayOnPage = true;
      } else if (
        !this.startedMousemovementOnTheRightHandSide &&
        this.mouse.x < 0
      ) {
        stayOnPage = true;
      }
    }
    for (const flip of this.flips) {
      // If this flip was being dragged, animate to its destination
      if (flip.dragging) {
        // Figure out which page we should navigate to
        let left = !click && this.mouse.x < 0;
        left = left || (click && this.mouse.x >= 0);
        if (left) {
          flip.target = -1;
          if (!stayOnPage) {
            this.page = Math.min(this.page + 1, this.flips.length);
          }
        } else {
          flip.target = 1;
          if (!stayOnPage) {
            this.page = Math.max(this.page - 1, 0);
          }
        }
      }

      flip.dragging = false;
      this.pageTurnCallback(this.page + 1);
    }
  }

  private render(): void {
    const needsRendering = this.flips.some(
      flip => flip.dragging || Math.abs(flip.progress) < 0.997
    );
    if (!needsRendering) {
      this.flips.forEach(
        (flip, index) =>
          (flip.page.style.display = index === this.page ? 'block' : 'block')
      );
      // this.canvas.style.display = 'none';
      return;
    }
    let visible = 0;
    let showCanvas = false;

    const pagesToRedraw: Array<any> = [];

    for (let i = this.flips.length - 1, len = this.flips.length; i >= 0; i--) {
      const flip = this.flips[i];
      if (flip.dragging || Math.abs(flip.progress) < 0.997) {
        flip.page.style.display = 'block';
        this.flips[i + 1].page.style.display = 'block';
        visible = 2;
        showCanvas = true;
        if (flip.dragging) {
          flip.target = Math.max(
            Math.min(this.mouse.x / this.PAGE_WIDTH, 1),
            -1
          );
        }

        // Ease progress towards the target value
        flip.progress += (flip.target - flip.progress) * 0.2;

        // If the flip is being dragged or is somewhere in the middle of the book, render it
        if (flip.dragging || Math.abs(flip.progress) < 0.997) {
          // this.drawFlip(flip, this.flips[i + 1].page);
          if (Math.abs(flip.progress - flip.lastProgress) >= 0.001) {
            pagesToRedraw.push([flip, this.flips[i + 1].page]);
            flip.lastProgress = flip.progress;
          }
        }
      } else {
        if (i === this.page) {
          flip.page.style.display = 'block';
          flip.page.style.width = this.PAGE_WIDTH + 'px';
          visible++;
        } else {
          //          flip.page.style.display = 'none';
        }
      }
    }
    this.canvas.style.display = 'block';
    if (pagesToRedraw.length > 0) {
      // Reset all pixels in the canvas
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      pagesToRedraw.forEach(([page, nextPage]) =>
        this.drawFlip(page, nextPage)
      );
    }
  }

  private drawFlip(flip: PageFlipState, nextPage: HTMLElement): void {
    // Strength of the fold is strongest in the middle of the book
    const strength = 1 - Math.abs(flip.progress);

    // Width of the folded paper
    const foldWidth = (this.BOOK_WIDTH / 2) * 0.5 * (1 - flip.progress);

    const pageWidth = flip.pageWidth;

    // X position of the folded paper
    const foldX = (this.BOOK_WIDTH / 2) * flip.progress + foldWidth;

    // How far the page should outdent vertically due to perspective
    const verticalOutdent = 20 * strength;

    // The maximum width of the left and right side shadows
    const paperShadowWidth =
      this.PAGE_WIDTH * 0.5 * Math.max(Math.min(1 - flip.progress, 0.5), 0);
    const rightShadowWidth =
      this.PAGE_WIDTH * 0.5 * Math.max(Math.min(strength, 0.5), 0);
    const leftShadowWidth =
      this.PAGE_WIDTH * 0.5 * Math.max(Math.min(strength, 0.5), 0);

    // Change page element width to match the x position of the fold
    flip.page.style.width = Math.min(this.PAGE_WIDTH, Math.max(foldX, 0)) + 'px';

    // rect(0, 400px, 180px, 218px);
    // nextPage.style.clip = `rect(0px ${this.PAGE_WIDTH}px ${this.PAGE_HEIGHT}px ${foldX}px`;


    this.context.save();
    this.context.translate(
      this.PAGE_WIDTH + this.DISTANCE_BETWEEN_PAGES / 2,
      0
    );

    // Draw a sharp shadow on the left side of the page
    this.context.strokeStyle = 'rgba(0,0,0,' + 0.05 * strength + ')';
    this.context.lineWidth = 30 * strength;
    this.context.beginPath();
    this.context.moveTo(foldX - foldWidth, -verticalOutdent * 0.5);
    this.context.lineTo(
      foldX - foldWidth,
      this.PAGE_HEIGHT + verticalOutdent * 0.5
    );
    this.context.stroke();

    // Right side drop shadow
    const rightShadowGradient = this.context.createLinearGradient(
      foldX,
      0,
      foldX + rightShadowWidth,
      0
    );
    rightShadowGradient.addColorStop(0, 'rgba(0,0,0,' + strength * 0.2 + ')');
    rightShadowGradient.addColorStop(0.8, 'rgba(0,0,0,0.0)');

    this.context.fillStyle = rightShadowGradient;
    this.context.beginPath();
    this.context.moveTo(foldX, 0);
    this.context.lineTo(foldX + rightShadowWidth, 0);
    this.context.lineTo(foldX + rightShadowWidth, this.PAGE_HEIGHT);
    this.context.lineTo(foldX, this.PAGE_HEIGHT);
    this.context.fill();

    // Left side drop shadow
    const leftShadowGradient = this.context.createLinearGradient(
      foldX - foldWidth - leftShadowWidth,
      0,
      foldX - foldWidth,
      0
    );
    leftShadowGradient.addColorStop(0, 'rgba(0,0,0,0.0)');
    leftShadowGradient.addColorStop(1, 'rgba(0,0,0,' + strength * 0.15 + ')');

    this.context.fillStyle = leftShadowGradient;
    this.context.beginPath();
    this.context.moveTo(foldX - foldWidth - leftShadowWidth, 0);
    this.context.lineTo(foldX - foldWidth, 0);
    this.context.lineTo(foldX - foldWidth, this.PAGE_HEIGHT);
    this.context.lineTo(foldX - foldWidth - leftShadowWidth, this.PAGE_HEIGHT);
    this.context.fill();

    // Gradient applied to the folded paper (highlights & shadows)
    const foldGradient = this.context.createLinearGradient(
      foldX - paperShadowWidth,
      0,
      foldX,
      0
    );
    foldGradient.addColorStop(0.35, '#fafafa');
    foldGradient.addColorStop(0.73, '#eeeeee');
    foldGradient.addColorStop(0.9, '#fafafa');
    foldGradient.addColorStop(1.0, '#e2e2e2');

    this.context.fillStyle = foldGradient;
    this.context.strokeStyle = 'rgba(0,0,0,0.06)';
    this.context.lineWidth = 0.5;

    // Draw the folded piece of paper
    this.context.beginPath();
    this.context.moveTo(foldX, 0);
    this.context.lineTo(foldX, this.PAGE_HEIGHT);
    this.context.quadraticCurveTo(
      foldX,
      this.PAGE_HEIGHT + verticalOutdent * 2,
      foldX - foldWidth,
      this.PAGE_HEIGHT + verticalOutdent
    );
    this.context.lineTo(foldX - foldWidth, -verticalOutdent);
    this.context.quadraticCurveTo(foldX, -verticalOutdent * 2, foldX, 0);

    this.context.fill();
    this.context.stroke();


    this.context.strokeStyle = 'rgb(255,0,0)';
    this.context.lineWidth = 2;
    this.context.beginPath();

    this.context.moveTo(this.DISTANCE_BETWEEN_PAGES / 2, 0);
    this.context.lineTo(
      this.PAGE_WIDTH + this.DISTANCE_BETWEEN_PAGES / 2,
      this.PAGE_HEIGHT);
    this.context.stroke();

    this.context.beginPath();
    this.context.strokeStyle = 'rgb(0,255,0)';
    this.context.moveTo(-this.DISTANCE_BETWEEN_PAGES / 2, 0);
    this.context.lineTo(
    -this.PAGE_WIDTH - this.DISTANCE_BETWEEN_PAGES / 2,
      0);
    this.context.stroke();

    this.context.beginPath();
    this.context.strokeStyle = 'rgb(0, 0,255)';
    this.context.moveTo(0, 0);
    this.context.lineTo(
    0,
      this.PAGE_HEIGHT);
    this.context.stroke();




    this.context.restore();
  }

  public openPage(pageNumber: number, pageLabel: string | undefined): void {
    const previousPage = this.page;
    // todo: enable jumping to page labels
    // PDFViewerApplication.pdfViewer._pageLabels
    this.page = pageNumber - 1;
    for (let i = 0, len = this.pages.length; i < len; i++) {
      const flip = this.flips[i];

      if (i / 2 < this.page / 2) {
        flip.target = -1;
        flip.progress = -1;
        flip.page.style.width = 0 + 'px';
        flip.lastProgress = -1;
        flip.dragging = false;
        // console.log(i + ' ' + 0);
      } else if (i / 2 > this.page / 2) {
        flip.target = 1;
        flip.progress = 1;
        flip.page.style.width = flip.pageWidth + 'px';
        flip.lastProgress = -1;
        flip.dragging = false;
        // console.log(i + ' ' + flip.pageWidth);
      } else {
        if (previousPage >= this.page) {
          if (flip.target === -1) {
            flip.target = 1;
            flip.progress = 0;
          }
        } else {
          if (flip.target === 1) {
            flip.target = -1;
            flip.progress = 0;
          }
      }


      }
    }
  }
}
