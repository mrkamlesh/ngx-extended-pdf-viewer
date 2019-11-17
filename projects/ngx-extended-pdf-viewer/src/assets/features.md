[ ] rotationchanging:  Breite und Höhe tauschen + neu zeichnen
[ ] scalechanging:     Resize
[ ] pagechanging:      Blättern
[ ] documentinit:      Book.stop()
[ ] scrollmodechanged: unverändert übernehmen (UI togglen, Book.start() oder Book.stop())
[ ] switchspreadmode:  $('#viewer').turn('display', this._spreadType()); + resize
[ ] pagesloaded:       Falls Autostart aktiv, dann Book.start()
[ ] baseviewerinit:    sichtbare Seite sind PDFViewerApplication.pdfViewer._getVisiblePages; ???
[ ] Book.start():      this._evSpread = PDFViewerApplication.eventBus._listeners.switchspreadmode;
                       PDFViewerApplication.eventBus._listeners.switchspreadmode = null;
                       viewer.scrollPageIntoView = (data) => {return this.link(data)};
                       viewer._getVisiblePages = () => {return this.load()};
                       Größe der Seiten ermitteln
                       $('#viewer').removeClass('pdfViewer').addClass('bookViewer').css({ opacity: 1 });;
                       $('#spreadOdd').prop('disabled', true);
                       $('#spreadEven').prop('disabled', true); und spread=0 (nur falls die Seiten unterschiedlich groß sind)
                       Algorithmus starten
[ ] Book.stop()        
[ ] load()             var views = PDFViewerApplication.pdfViewer._pages;
                       var page = PDFViewerApplication.page;
                       var min = Math.max(page - ((this._spread === 0) ? 2 : 3 + (page%2)), 0);
                       var max = Math.min(page + ((this._spread === 0) ? 1 : 3 - (page%2)), views.length);
