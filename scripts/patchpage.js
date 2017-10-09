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
    var m = html.match('((<span \[^>\]*>)? *(<u>)?\[0-9\]+(</u>)? (</span>)?)');
    if (!m) return [0, 0];
    var offset = html.indexOf(m[0]);
    return [offset, offset + m[0].length];
  }
  this.adjustUrlForColumnWidth = function(src, widthMap) {
    var filetype = src.substr(src.lastIndexOf('.') + 1);
    if (filetype in widthMap)
      src += '?column_width=' + widthMap[filetype];
    return src;
  };
  this.adjustDiffFrameForInline = function(frame) {
    frame.find('html').css('margin', 'auto');

    var code = frame.find('.code');
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
    var inspector = this;
    return function() {
      var href = this.href;
      var diffHref = href.substr(0, href.lastIndexOf('/') + 1).replace('patch', 'diff') + this.innerHTML.trim();
      var rowId = $(this).data().rowId;
      var frameId = rowId + inspector.frameIdSuffixFromDiffHref(diffHref);
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
    var text = $('div div div span.extra').eq(0).text();
    if (!text.match('Base URL: .*')) {
      console.error('Bad base url match ??');
      return '';
    }
    return text.substring(10);
  }
  this.modifyPatchPage = function() {
    var baseUrl = $('.issue_details_sidebar').children().eq(4);
    var html = baseUrl.html();
    var idx = html.indexOf('<br>');
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

var domInspector = new RietveldInspector();

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

		_hideFrame(row, function() {
			showSpinner(row);
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
					iframeLoaded(frameId);

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

	function _updateShowingFrameId(row, newId) {
		row.data({ showingFrameId: newId });
		updateLinksForRow(row);
	}

	function _hideFrame(row, callback) {
		// TODO: from loadQueue.js
		_cancelLoadIfPending(row.data().loadingFrameId);
		row.data({ loadingFrameId: null });

		const frameId = row.data().showingFrameId;
		const currFrame = $('#' + frameId);
		_updateShowingFrameId(row, null);
		// TODO: from ?
		hideSpinner(row, function() {
			row.find('.rb-frameDiv')
				.slideUp(400, function() {
					row.hide();
					currFrame.hide();
					if (callback) { callback() }
				});
		});
	}

	function _swapFrame(row, frame) {
		const frameId = row.data().showingFrameId;
		const currFrame = $('#' + frameId);
		// TODO from loadQueue.js
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
		// TODO from ?
		hideSpinner(row);
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

	function _showAllFramesInColumn(table, columnId) {
		table.find('.rb-diffRow').each(function() {
			toggleFrameForColumnId($(this), columnId, true);
		});
	}

	function _hideAllDiffs(tables) {
		// Hide all currently showing inline diffs.
		tables.find('.rb-frameRow').each(function() {
			_hideFrame($(this));
		});
	}

	// public methods
	return {
		selectRow(row, dir) {
			const pos = $('.rb-diffRow').index(row);
			// TODO: from ?
			sendCustomEvent('rb-gotoTrPos', { pos, dir });
		},

		toggleFrameForColumnId(row, column, show) {
			const difflink = row.find('.' + column);
			if (difflink.length == 0) {
				_hideFrame(row.next());
			} else {
				const frame = _getFrameForColumnId(row, column);
				if (frame.length > 0) {
					_toggleFrame(frame, show);
				} else {
					_queueFrameLoad(_createFrameForLink(difflink));
				}
			}
		},

		toggleFrameForLink(link) {
			toggleFrameForColumnId(link.closest('.rb-diffRow'), link.data().columnId);
		},

		iframeLoaded(id) {
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

			inner.find('html').keydown(handleFrameKeyDown);

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
		},

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
								toggleFrameForLink($(this));
								selectRow($(this).closest('tr'));
								ev.preventDefault();
							}
					});
				}
			});
		},

		addShowButton(cell, columnId, text) {
			if (cell.find('.' + columnId).length > 0) {
				return;
			}

			const button = $('<input type="button" value="' + text + '"/>')
				.addClass('rb-headerButton')
				.addClass('rb-blueButton')
				.addClass(columnId)
				.data({ columnId: columnId })
				.click(function() {
					_showAllFramesInColumn(cell.closest('.rb-patchTable'), columnId);
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
		},

		createFrameDiv() {
			return $('<div/>')
				.addClass('rb-frameDiv')
				.css('margin', 'auto')
				.hide();
		},

		createFrameContainer() {
			return div = $('<div/>')
				.addClass('rb-frameContainer')
				.css('width', '100%')
				.append(_createSpinner())
				.append(createFrameDiv());
		},

		createFrameRow() {
			return $('<tr id="' + rowId + '"/>')
				.addClass('rb-frameRow')
				.data({ showingFrameId: null })
				.append(
					$('<td colspan=1000/>')
					.append(createFrameContainer()))
				.hide();
		},

		createHideAllButton() {
			return $('<input type="button" value="Hide all"/>')
				.addClass('rb-headerButton')
				.addClass('rb-redButton')
				.click(function() {
					_hideAllDiffs($(this).closest('.rb-patchTable'));

				});
		},
	}

})();