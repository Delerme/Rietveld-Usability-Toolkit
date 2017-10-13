function RietveldInspector() {
  this.isDiff = function() {
    return Boolean(document.URL.match(/.*\/diff2?\//));
  };
  this.isPatch = function() {
    return $('.issue-details').length > 0;
  };
  this.codelineAll = function() {  return '\
      .oldlight, .olddark, .newlight, .newdark, \
      .oldreplace, .olddelete, .oldinsert, .oldequal, .oldblank, \
      .oldreplace1, .newreplace1, \
      .newreplace, .newdelete, .newinsert, .newequal, .newblank, \
      .oldmove, .oldchangemove, .oldchangemove1, .oldmove_out, .oldchangemove_out, \
      .newmove, .newchangemove, .newchangemove1, \
      .udiffadd, .udiffremove, .udiff, .debug-info';
  };
  this.codelineOldNew = function() { return '\
      .oldreplace, .olddelete, .oldinsert, .oldequal, .oldblank, .oldreplace1, \
      .oldmove, .oldchangemove, .oldchangemove1, .oldmove_out, .oldchangemove_out, \
      .newreplace1, .newreplace, .newdelete, .newinsert, .newequal, .newblank, \
      .newmove, .newchangemove, .newchangemove1, \
      .rb-null';
  };
  this.codelineOldClasses = [
    '.oldreplace',
    '.olddelete',
    '.oldinsert',
    '.oldequal',
    '.oldblank',
    '.oldreplace1',
    '.oldmove',
    '.oldchangemove',
    '.oldchangemove1',
    '.oldmove_out',
    '.oldchangemove_out',
    ];
  this.codelineNewClasses = [
    '.newreplace1',
    '.newreplace',
    '.newdelete',
    '.newinsert',
    '.newequal',
    '.newblank',
    '.newmove',
    '.newchangemove',
    '.newchangemove1',
    ];
  this.codelineNew = function(append) {
    append = append || '';
    return this.codelineNewClasses.map(function(x) { return x + append; }).join(', ');
  };
  this.codelineOld = function(append) {
    append = append || '';
    return this.codelineOldClasses.map(function(x) { return x + append; }).join(', ');
  };
  this.codelineLight = function() { return '.oldlight, .newlight'; };
  this.codelineDark = function() { return '.olddark, .newdark'; };

  this.codelineOldReplace = function() { return '.oldreplace, .oldreplace1'; };
  this.codelineNewReplace = function() { return '.newreplace, .newreplace1'; };
  this.codelineOldDelete = function() { return '.olddelete'; };
  this.codelineNewInsert = function() { return '.newinsert'; };

  this.codelineOldReplaceDark = function() { return ['.oldreplace .olddark', '.oldreplace1 .olddark']; };
  this.codelineNewReplaceDark = function() { return ['.newreplace .newdark', '.newreplace1 .newdark']; };
  this.codelineOldReplaceLight = function() { return ['.oldreplace, .oldreplace1', '.oldreplace .oldlight', '.oldreplace1 .oldlight']; };
  this.codelineNewReplaceLight = function() { return ['.newreplace, .newreplace1', '.newreplace .newlight', '.newreplace1 .newlight']; };

  this.codeTableBody = function() { return '#thecode tbody'; }

  this.observeNewCodelines = function(func) {
    new WebKitMutationObserver(func).observe($(this.codeTableBody())[0], { childList: true });
  }

  this.getCodelineInnerChrome = function() {
    return $('tr[id^="skip-"]').add('.inline-comments');
  };
  this.getCodeBreaks = function() {
    return $('tr[id^="skip-"]').map(function() { return parseInt($(this).attr('id').substring(5)); }).get();
  }
  this.lineNumberRange = function(html) {
    let m = html.match('((<span \[^>\]*>)? *(<u>)?\[0-9\]+(</u>)? (</span>)?)');
    if (!m) return [0, 0];
    let offset = html.indexOf(m[0]);
    return [offset, offset + m[0].length];
  }
  this.adjustUrlForColumnWidth = function(src, widthMap) {
    let filetype = src.substr(src.lastIndexOf('.') + 1);
    if (filetype in widthMap)
      src += '?column_width=' + widthMap[filetype];
    return src;
  };
  this.adjustDiffFrameForInline = function(frame) {
    frame.find('html').css('margin', 'auto');

    let code = frame.find('.code');
    code.children().css('margin', '3px');
    code.parents().andSelf()
      .css('margin', '0')
      .css('display', 'table')
      .siblings()
        .hide();
    code.find('.codenav').hide();
    code.find('#table-top').css('position', '');
    code.find('#codeTop').hide();
    code.find('#codeBottom').hide();
  };
  this.findPatchTables = function() { return $('.issue-list table'); };
  this.findDiffLinks = function() { return $('.issue-list a[href*="/diff"]'); };
  this.findUnifiedLinks = function() { return $('.issue-list a[href*="/patch/"]'); };
  this.unifiedLinkRewriter = function() {
    let inspector = this;
    return function() {
      let href = this.href;
      let diffHref = href.substr(0, href.lastIndexOf('/') + 1).replace('patch', 'diff') + this.innerHTML.trim();
      let rowId = $(this).data().rowId;
      let frameId = rowId + inspector.frameIdSuffixFromDiffHref(diffHref);
      $(this).data({ patch: href, diff: diffHref, frameId: frameId });
    };
  };
  this.findPatchContainers = function() { return $('div[id^=ps-]'); };
  this.frameIdSuffixFromDiffHref = function(href) {
    return '_frame_' + href.match('/diff2?/([^/]*)/')[1].replace(':', '_');
  }
  this.columnIdFromHtml = function(html) { return html; };
  this.filePathFromDiffUrl = function(url) {
    return url.match('.*/[0-9]*/diff2?/[0-9:]*/([-a-zA-Z_./]*).*')[1];
  }
  this.baseUrlOnDiffPage = function() {
    let text = $('div div div span.extra').eq(0).text();
    if (!text.match('Base URL: .*')) {
      console.error('Bad base url match ??');
      return '';
    }
    return text.substring(10);
  }
  this.modifyPatchPage = function() {
    let baseUrl = $('.issue_details_sidebar').children().eq(4);
    let html = baseUrl.html();
    let idx = html.indexOf('<br>');
    // The baseurl is often long and makes the whole left pane too long... hide it.
    function hideBaseUrl() {
      chrome.storage.sync.get('hideBaseUrl', function(items) {
        if (items['hideBaseUrl']) {
          baseUrl.html(html.substr(0, idx) + html.substr(idx).replace(/\//g, '/&#8203;'));
          $('.meta').attr('width', '10%');
        } else {
          if ($('.meta').attr('width')[0] == '10%') {
            $('.meta').attr('width', '20%');
          }
          baseUrl.html(html);
        }
      });
    }
    hideBaseUrl();
    chrome.storage.onChanged.addListener(function(changes, namespace) {
      hideBaseUrl();
    }, 'hideBaseUrl');
  };
  this.findSelectedRow = function() {
    return $('.first img').filter(function() { return $(this).css('visibility') != 'hidden'; }).closest('tr');
  };
}

let domInspector = new RietveldInspector();

// manages inserting and removing inline
// diffs on the patch page
const frameManager = (function() {

  // spinner functions
  // TODO separate module?
  function _createSpinner() {
    const spinnerDiv = $('<div/>')
      .addClass('rb-spinnerDiv')
      .css('text-align', 'center');
    const spinner = $('<div/>')
      .addClass('rb-spinner')
      .css('height', '50px')
      .css('margin', 'auto');
    for (let i = 0; i < 12; i++) {
      spinner.append($('<div/>').addClass('rb-bar' + i));
    }
    return spinnerDiv.append(spinner);
  }

  function _showSpinner(row, callback) {
    row.show();
    row.data({ spinnerShowing: true });
    row.find('.rb-spinner').show(0, function() {
      if (callback) callback();
    });
  }

  function _hideSpinner(row, callback) {
    row.data({ spinnerShowing: false });
    row.find('.rb-spinner').hide(0, function() {
      if (callback) callback();
    });
  }

  // load queueing functions
  let loadQueue = [];
  let loading = 0;

  function _shiftLoadQueue() {
    // TODO: Does allowing staggered loads defeat the purpose of the queueThrottle?
    // TODO: Use item priority
    return loadQueue.shift();
  }

  function _pushLoadQueue(id, priority, fn) {
    _cancelLoadIfPending(id);
    loadQueue.push({ id: id, priority: priority, fn: fn });
    // If a bunch of pushes are triggered at the same time, we want to wait a bit
    // before pumping in case a higher priority load is about to be pushed.
    setTimeout(_pumpLoadQueue, 20);
  }

  function _pumpLoadQueue() {
    if (loadQueue.length == 0) return;
    chrome.storage.sync.get(['loadLimit', 'queueThrottle'], function(items) {
      if (loading < items['loadLimit'] && loadQueue.length > 0) {
        loading++;
        _shiftLoadQueue().fn(function() {
          loading--;
          // Throttle the load queue a bit.
          setTimeout(_pumpLoadQueue, items['queueThrottle']);
        });
      }
    });
  }

  function _cancelLoadIfPending(id) {
    for (let i = loadQueue.length - 1; i >= 0; i--) {
      if (loadQueue[i].id == id) {
        loadQueue.remove(i);
      }
    }
  }

  function _queueFrameLoad(frame) {
    const frameId = frame.attr('id');
    const rowId = frameId.match('inline_diff_row_[0-9]*')[0];
    const row = $('#' + rowId);
    const priority = row.index();

    frameManager.hideFrame(row, function() {
      _showSpinner(row);
    });

    row.data({ loadingFrameId: frameId });

    _pushLoadQueue(frameId, priority, function(callback) {
      chrome.storage.sync.get(['autoSetColumnWidth', 'columnWidthMap'], function(items) {
        let src = frame.data().href;
        if (items['autoSetColumnWidth']) {
          src = domInspector.adjustUrlForColumnWidth(src, items['columnWidthMap']);
        }

        row.find('.rb-frameDiv').append(frame);

        frame.one('load', function() {
          _iframeLoaded(frameId);

          if (row.data().loadingFrameId == frameId) {
            row.find('.rb-frameDiv').css('min-height', '50px');
            _showFrame(row, frame, function() {
              row.find('.rb-frameDiv').css('min-height', '');
            });
          }

          if (callback) callback();
        });

        frame.attr('src', src);
      });
    });
  }

  // frame functions
  function _createFrameForLink(link) {
    const { frameId, diff: href } = link.data();
    const frame = $('<iframe id="' + frameId + '"/>')
      .addClass('rb-inlineDiff')
    .attr('seamless', true)
    .attr('frameBorder', '0')
    .data({ href })
    .hide();

    // Injecting the frame into the page is deferred until the load actually
    // begins (i.e. it's popped from the load queue). This is done because there
    // is a noticeable delay when injecting an iframe into the page, and we can
    // hide that delay with the one caused by loading the iframe. This is
    // particularly helpful for the "All xxx" buttons.
    return frame;
  }

  function _getFrameForLink(link) {
    return $('#' + link.data().frameId);
  }

  function _getFrameForColumnId(row, id) {
    const diffLink = row.find('.' + id);
    if (diffLink.length === 0) {
      return $();
    }
    return _getFrameForLink(diffLink);
  }

  // Update the links in the previous row so that when an inline diff is shown,
  // the proper link is highlighted.
  function _updateLinksForRow(row) {
    let showingFrameId = row.data().showingFrameId;
    let links = row.prev().find('.rb-diffLink');
    links.removeClass('rb-showingDiff');
    links.filter(function() {
        return $(this).data().frameId == row.data().showingFrameId
      }).addClass('rb-showingDiff');
  }

  function _updateShowingFrameId(row, newId) {
    row.data({ showingFrameId: newId });
    _updateLinksForRow(row);
  }

  function _swapFrame(row, frame) {
    const frameId = row.data().showingFrameId;
    const currFrame = $('#' + frameId);
    _cancelLoadIfPending(frameId);
    currFrame.hide();
    frame.show();
    _updateShowingFrameId(row, frame.attr('id'));
  }

  function _showFrame(row, frame, callback) {
    const currFrameId = row.data().showingFrameId;
    if (currFrameId) {
      _swapFrame(row, frame);
      return;
    }

    row.show();
    frame.show();
    _hideSpinner(row);
    _updateShowingFrameId(row, frame.attr('id'));
    row.find('.rb-frameDiv')
      .slideDown(400, function() {
        if (callback) {
          callback();
        }
      });
  }

  function _toggleFrame(frame, show) {
    if (!frame.data().frameLoaded) {
      return;
    }
    const row = frame.closest('tr'),
      frameId = frame.attr('id'),
      currFrameId = row.data().showingFrameId;
    const canHide = !show;
    if (canHide && currFrameId == frameId) {
      _hideFrame(row);
    } else {
      _showFrame(row, frame);
    }
  }

  function _createFrameDiv() {
    return $('<div/>')
      .addClass('rb-frameDiv')
      .css('margin', 'auto')
      .hide();
  }

  function _toggleFrameForColumnId(row, column, show) {
    const difflink = row.find('.' + column);
    if (difflink.length == 0) {
      frameManager.hideFrame(row.next());
    } else {
      const frame = _getFrameForColumnId(row, column);
      if (frame.length > 0) {
        _toggleFrame(frame, show);
      } else {
        _queueFrameLoad(_createFrameForLink(difflink));
      }
    }
  }

  function _createFrameContainer() {
    return div = $('<div/>')
      .addClass('rb-frameContainer')
      .css('width', '100%')
      .append(_createSpinner())
      .append(_createFrameDiv());
  } 

  function _iframeLoaded(id) {
    const frame = $('#' + id);
    const frameDiv = frame.closest('.rb-frameDiv');
    frame.data({ frameLoaded: true });
    const row = frame.closest('tr');

    const inner = frame.contents();

    const resizer = function() {
      const newHeight = inner.find('html').height();
      const newWidth = inner.find('html').width();
      if (frame.css('height') != newHeight || frame.css('width') != newWidth) {
        frameDiv.css('height', newHeight).css('width', newWidth);
        // Chrome 23 requires that the frame be resized.
        frame.css('height', newHeight).css('width', newWidth);
      }
    };

    domInspector.adjustDiffFrameForInline(inner);

    // inner.find('html').keydown(handleFrameKeyDown);

    // The observer must be installed before the first resizer() call (otherwise
    // we may miss a modification between the resizer() call and observer
    // installation).
    const observer = new WebKitMutationObserver(resizer);
    inner.find('html').each(function() {
      observer.observe(this, { attributes: true, subtree: true } );
    });

    injectScriptFile(inner[0], chrome.extension.getURL('scripts/inject/inline_frame.js'));
    injectScript(inner[0], function(id) { rb_frameId = id; }, id);

    // FIXME: Calling resizer() here should work, but somehow it causes a bug
    // where the frame sometimes overlaps the next row after load.
    //resizer();

    // Force a reflow after a short time. This "fixes" a bug where comments are not
    // displayed on first load (100% reproducible on
    // https://codereview.appspot.com/6493094/).
    setTimeout(function() { inner.find('html').toggleClass('rb-forceReflow'); }, 100);
  }


  // public methods
  return {

    hideFrame(row, callback) {
      _cancelLoadIfPending(row.data().loadingFrameId);
      row.data({ loadingFrameId: null });

      const frameId = row.data().showingFrameId;
      const currFrame = $('#' + frameId);
      _updateShowingFrameId(row, null);
      _hideSpinner(row, function() {
        row.find('.rb-frameDiv')
          .slideUp(400, function() {
            row.hide();
            currFrame.hide();
            if (callback) { callback() }
          });
      });
    },

    showAllFramesInColumn(table, columnId) {
      table.find('.rb-diffRow').each(function() {
        _toggleFrameForColumnId($(this), columnId, true);
      });
    },

    toggleFrameForLink(link) {
      _toggleFrameForColumnId(link.closest('.rb-diffRow'), link.data().columnId);
    },

    createFrameRow() {
      return $('<tr id="' + rowId + '"/>')
        .addClass('rb-frameRow')
        .data({ showingFrameId: null })
        .append(
          $('<td colspan=1000/>')
          .append(_createFrameContainer()))
        .hide();
    }

  }

})();

const pageManager = (function() {

  function _hideAllDiffs(tables) {
    // Hide all currently showing inline diffs.
    tables.find('.rb-frameRow').each(function() {
      frameManager.hideFrame($(this));
    });
  }

  function _selectRow(row, dir) {
    const pos = $('.rb-diffRow').index(row);
    // TODO: from lib
    sendCustomEvent('rb-gotoTrPos', { pos, dir });
  }

  function _addShowButton(cell, columnId, text) {
    if (cell.find('.' + columnId).length > 0) {
      return;
    }

    const button = $('<input type="button" value="' + text + '"/>')
      .addClass('rb-headerButton')
      .addClass('rb-blueButton')
      .addClass(columnId)
      .data({ columnId: columnId })
      .click(function() {
        frameManager.showAllFramesInColumn(cell.closest('.rb-patchTable'), columnId);
      });

    const siblingsBefore = cell.find('input').filter(function() {
    const otherId = $(this).data().columnId;

    if (otherId.length < columnId.length) return true;
      return otherId < columnId;
    });

    if (siblingsBefore.length > 0) {
      siblingsBefore.last().after(button);
    } else {
      cell.prepend(button);
    }
  }

  function _createHideAllButton() {
    return $('<input type="button" value="Hide all"/>')
      .addClass('rb-headerButton')
      .addClass('rb-redButton')
      .click(function() {
        _hideAllDiffs($(this).closest('.rb-patchTable'));
      });
  }
  
  function _currentColumn() {
    let row = domInspector.findSelectedRow();
    let frameId = row.next().data('showingFrameId');
    if (frameId) {
      let links = row.find('.rb-diffLink');
      let link = links.filter(function() { return $(this).data('frameId') == frameId; });
      return link.data('columnId');
    } else {
      return 'rb-columnView';
    }
  }
  
  // public methods
  return {

    updatePatchTables() {
      chrome.storage.sync.get(['rewriteUnifiedLinks', 'enableInlineDiffs', 'createViewAllButtons'], function(items) {
        const shouldRewrite = items['rewriteUnifiedLinks'];
        const enableInline = items['enableInlineDiffs'];
        const createViewAll = items['createViewAllButtons'];

        $('.rb-tableHeader.rb-modified').toggle(createViewAll);
        $('.rb-tableHeader.rb-original').toggle(!createViewAll);

        if (!enableInline) {
          _hideAllDiffs($('.rb-patchTable'));
        }

        $('.rb-filename')
          .toggleClass('rb-diffLink', shouldRewrite)
          .each(function() {
            this.href = $(this).data(shouldRewrite ? 'diff' : 'patch');
          });

        $('.rb-diffLink').off('click');

        if (enableInline) {
          $('.rb-diffLink')
            .click(function(ev) {
              if (ev.button == 0 && !(ev.metaKey || ev.ctrlKey || ev.shiftKey)) {
                frameManager.toggleFrameForLink($(this));
                _selectRow($(this).closest('tr'));
                ev.preventDefault();
              }
          });
        }
      });
    },

    injectDataAndNodes() {
      // Modify table header rows.
      const newPatchTables = domInspector.findPatchTables()
        .filter(':not(.rb-patchTable)')
        .addClass('rb-patchTable')
        .find('tr:first-of-type')
        .addClass('rb-tableHeader')
        .addClass('rb-original')
        .each(function() {
          let modified = $(this).clone()
            .removeClass('rb-original')
            .addClass('rb-modified')
            .hide();
          $(this).after(modified);

          modified.children().addClass('rb-headerCell');

          let unified = modified.children().eq(1)
            .addClass('rb-unifiedHeader');
          let hideAll = $('<div/>')
            .addClass('rb-hideAll')
            .css('float', 'right');
          hideAll.append(_createHideAllButton());

          unified.append(hideAll);

          const diff = unified.next()
            .addClass('rb-diffHeader')
            .html('');

          _addShowButton(diff, 'rb-columnView', 'Show All');

          let delta = diff.next()
            .addClass('rb-deltaHeader')
            .html('');
        });

      let difflinks = domInspector.findDiffLinks()
        .filter(':not(.rb-diffLink)')
        .addClass('rb-diffLink');

      // Update rows first since frameId is based on rowId
      difflinks.closest('tr:not(.rb-diffRow)')
        .addClass('rb-diffRow')
        .each(function() {
          rowId = 'inline_diff_row_' + currentId++;

          $(this).find('a').andSelf().data({ rowId: rowId });

          $(this).after(frameManager.createFrameRow(rowId));
        });

      difflinks.each(function() {
        let href = this.href;
        let frameId = $(this).data().rowId + domInspector.frameIdSuffixFromDiffHref(href);
        $(this).data({ frameId: frameId, diff: href });
        let html = $(this).html().trim();
        let columnId = 'rb-column' + domInspector.columnIdFromHtml(html);
        $(this).addClass(columnId);
        $(this).data({ columnId: columnId});
        // For columnId == 'rb-columnView' the button is installed above.
        if (columnId != 'rb-columnView') {
          let cell = $(this).closest('.rb-patchTable').find('.rb-deltaHeader');
          _addShowButton(cell, columnId, 'All ' + html);
        }
      })

      domInspector.findUnifiedLinks()
        .filter(':not(.rb-filename)')
        .addClass('rb-filename')
        .addClass('rb-columnView')
        .data({ columnId: 'rb-columnView'})
        .each(domInspector.unifiedLinkRewriter());
    },
    
    enableAnimations() {
      chrome.storage.sync.get('enableAnimations', function(items) {
        $.fx.off = !items['enableAnimations'];
      });
    },

    setupPatchSetObserver() {
      // TODO: These observers are only needed to detect the loading of patch set
      // data, we should be able to disconnect them from each patch set after its
      // loaded.
      let observer = new WebKitMutationObserver(function() {
        pageManager.injectDataAndNodes();
        pageManager.updatePatchTables();
      });
      domInspector.findPatchContainers()
        .filter(':not(.rb-patchContainer)')
        .addClass('rb-patchContainer')
        .each(function () { observer.observe(this, { childList: true, subtree: true}); });
    },

    selectNextInColumn(ev) {
      let dir = undefined;
      if (ev && ev.detail) dir = ev.detail.dir;
      let rows = $('.rb-diffRow');
      let idx = rows.index(domInspector.findSelectedRow());
      rows = rows.slice(idx + 1).find('.' + _currentColumn()).closest('tr');
      if (rows.length > 0) {
        selectRow(rows.eq(0), dir);
      }
    },

    selectPrevInColumn(ev) {
      let dir = undefined;
      if (ev && ev.detail) dir = ev.detail.dir;
      let rows = $('.rb-diffRow');
      let idx = rows.index(domInspector.findSelectedRow());
      rows = rows.slice(0, idx).find('.' + _currentColumn()).closest('tr');
      if (rows.length > 0) {
        selectRow(rows.eq(rows.length - 1), dir);
      }
    }

  }

})();

chrome.storage.onChanged.addListener(pageManager.updatePatchTables, ['rewriteUnifiedLinks', 'enableInlineDiffs', 'createViewAllButtons']);

let currentId = 0;

pageManager.setupPatchSetObserver();
pageManager.injectDataAndNodes();
pageManager.updatePatchTables();
domInspector.modifyPatchPage();
pageManager.enableAnimations();
chrome.storage.onChanged.addListener(function(changes, namespace) {
  pageManager.enableAnimations();
}, 'enableAnimations');

document.addEventListener('rb-selectNextInColumn', pageManager.selectNextInColumn);
document.addEventListener('rb-selectPrevInColumn', pageManager.selectPrevInColumn);
