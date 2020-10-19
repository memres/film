$(document).ready(function() {
	var conout, volout, clear, home = $('h1 a').attr('href'), inline = /Android|iPhone|iPad|Opera Mini|Smart/i.test(navigator.userAgent), cleared = '<h3>Your favorites list<div>has been cleared</div></h3>';
	injection();
	$('.search form').on('submit', function(e) {
		e.preventDefault();
		navigator.vibrate(50);
		ajaxify(home + '?q=' + encodeURIComponent($('input', this).val()).replace(/%20/, '+'));
	});
	$('.login form').on('submit', function(e) {
		e.preventDefault();
		let t = $(this), b = $('button', this), c = b.html();
		b.children('i').addClass('fa-spinner fa-spin').parent().css('pointer-events', 'none');
		$.post(home + 'login', t.serialize(), function(e) {
			if (e) {
				b.css({'color': '#f44', 'text-shadow': '0 0 1px #000'}).children('i').attr('class', 'fas fa-ban').next().text(e).fadeTo(250,0).fadeTo(250,1).fadeTo(250,0).fadeTo(250,1);
				setTimeout(function() {
					b.removeAttr('style').html(c).css('pointer-events', 'auto');
				}, 3000);
			}
			else location.reload();
		});
	});
	$('.settings button').on('click', function() {
		$('i', this).addClass('fa-spinner fa-spin');
		$.get(home + 'logout', function() {
			location.reload();
		});
	});
	$('.settings label').on('click', function() {
		let t = $(this);
		t.css('pointer-events', 'none').children('i').addClass('fa-spin');
		$.get(home + 'toggle?o=' + t.attr('for') + '&b=' + (t.children('i').hasClass('fa-toggle-off') ? 'true' : 'false'), function() {
			t.css('pointer-events', 'auto').children('i').removeClass('fa-spin').toggleClass('fa-toggle-off fa-toggle-on');
		});
	});
	$('header li a:lt(3)').on('click', function() {
		if ($('header a').not(this).hasClass('on')) {
			$('header .on').removeClass('on');
			$('nav:visible').fadeOut();
		}
		$(this).toggleClass('on');
		$('.' + $(this).attr('id')).slideToggle();
		if ($(this).is('#search.on')) {
			if (!$('.search').hasClass('ok')) {
				$('.search').addClass('ok').children('form').attr('action', home);
				$.getJSON(home + 'titles', function(e) {
					$('.search input').autocomplete({
						minLength: 2,
						source: e,
						select: function(event, ui) {
							$(event.target).val(ui.item.value);
							$('.search form').submit();
						}
					});
				});
			}
			setTimeout(function() {
				$('.search input').focus();
			}, 400);
		}
		if ($(this).is('#login.on')) {
			setTimeout(function() {
				$('#u').focus();
			}, 400);
		}
	});
	$('.fa-chevron-up').on('click', function() {
		$('html, body').animate({scrollTop: 0});
	});
	$('.fa-keyboard').on('click', function() {
		$('kbd').show().parent().addClass('freeze');
	});
	$('kbd').on('click', function() {
		$(this).hide().parent().removeClass('freeze');
	});
	// Dynamic
	$(document).on('fullscreenchange', lurk);
	$(document).on('wheel', 'address', lurk);
	$(document).on('touchmove', 'address', lurk);
	$(document).on('mousemove', 'address', lurk);
	$(document).on('mousedown', 'address', lurk);
	$(document).on('mousewheel', 'address', lurk);
	$(document).on('touchstart', 'address', lurk);
	$(document).on('MSPointerDown', 'address', lurk);
	$(document).on('MSPointerMove', 'address', lurk);
	$(document).on('DOMMouseScroll', 'address', lurk);
	$(document).on('click', 'bdi i:eq(0)', playpause);
	$(document).on('click', 'bdi i:eq(1)', fulscreen);
	$(document).on('contextmenu', 'video', function() {
		return false;
	});
	$(document).on('fullscreenchange', function() {
		if ($('address').fullScreen()) $('bdi i:eq(1)').attr('class', 'fas fa-compress');
		else $('bdi i:eq(1)').attr('class', 'fas fa-expand');
	});
	$(document).on('mousemove', 'figure', function(e) {
		if ($('video')[0].duration) {
			var ratio = (((e.pageX - ($('figure')[0].getBoundingClientRect().left + document.body.scrollLeft)) / $('figure').width()) * 100);
			$('.stamp').show().css('left', ratio + '%').text(calculate(($('video')[0].duration * ratio) / 100));
		}
	});
	$(document).on('mouseout', 'figure', function() {
		$('.stamp').hide();
	});
	$(document).on('click', '[data-movie]', function() {
		let t = $(this);
		t.css('pointer-events', 'none').children('i').addClass('fa-spinner fa-spin');
		$.get(home + 'similar?m=' + t.attr('data-movie'), function(e) {
			$('section').html(e).before('<h2>Similar Movies</h2>');
		});
	});
	$(document).on('click', 'article b, h5 b', function() {
		var i = $('i', this);
		favorite(i.hasClass('far') ? 'add' : 'remove', $(this).attr('id'), i);
		if ($('.favorites').length) {
			var t = $(this).parents('article');
			t.fadeOut();
			setTimeout(function() {
				t.remove();
			}, 400);
			if (!$('article').length) $('#content').html(cleared);
		}
	});
	$(document).on('click', '.favorites aside a', function() {
		if ($(this).is('.prev')) {
			favorite('clear');
			$('#content').fadeOut();
			setTimeout(function() {
				$('#content').html(cleared)
			}, 400);
		}
		else if ($(this).is('.next')) $(this).parent().html(clear);
		else {
			navigator.vibrate([50, 50, 50, 50, 50, 50, 100, 100, 200]);
			$(this).parent().html('<a class="prev"><i class="fas fa-check-circle"></i> Yes</a><a class="next"><i class="fas fa-times-circle"></i> No</a>');
		}
	});
	$(document).on('click', 'a[href]:not([rel="external"])', function(e) {
		e.preventDefault();
		navigator.vibrate(50);
		ajaxify($(this).attr('href'));
	});
	$(window).on('popstate', function() {
		ajaxify(location.href, true);
	});
	$(window).on('keydown', function(e) {
		if ($(e.target).is('INPUT')) return;
		if ($('video')[0]) {
			if (e.which == 32) return false;
			if (e.which == 37) backward();
			if (e.which == 39) forward();
			if (e.which == 109 && $('video')[0].volume > 0) $('video')[0].volume = (Math.round($('video')[0].volume * 100) - 5) / 100;
			if (e.which == 107 && $('video')[0].volume < 1) $('video')[0].volume = (Math.round($('video')[0].volume * 100) + 5) / 100;
		}
	});
	$(window).on('keyup', function(e) {
		if ($(e.target).is('INPUT')) return;
		if ($('video')[0]) {
			if (e.which == 32) playpause();
			if (e.which == 70) fulscreen();
			if (e.which == 77) $('video')[0].muted = !$('video')[0].muted;
			if (e.which == 80 && document.pictureInPictureEnabled) document.pictureInPictureElement ? document.exitPictureInPicture() : $('video')[0].requestPictureInPicture();
			if (e.which == 48 || e.which == 96) $('video')[0].currentTime = 0;
			if (e.which == 49 || e.which == 97) $('video')[0].currentTime = .1 * $('video')[0].duration;
			if (e.which == 50 || e.which == 98) $('video')[0].currentTime = .2 * $('video')[0].duration;
			if (e.which == 51 || e.which == 99) $('video')[0].currentTime = .3 * $('video')[0].duration;
			if (e.which == 52 || e.which == 100) $('video')[0].currentTime = .4 * $('video')[0].duration;
			if (e.which == 53 || e.which == 101) $('video')[0].currentTime = .5 * $('video')[0].duration;
			if (e.which == 54 || e.which == 102) $('video')[0].currentTime = .6 * $('video')[0].duration;
			if (e.which == 55 || e.which == 103) $('video')[0].currentTime = .7 * $('video')[0].duration;
			if (e.which == 56 || e.which == 104) $('video')[0].currentTime = .8 * $('video')[0].duration;
			if (e.which == 57 || e.which == 105) $('video')[0].currentTime = .9 * $('video')[0].duration;
		}
		if (e.which == 13) random();
		if (e.which == 66 && $('[rel="prev"]').length) ajaxify($('[rel="prev"]').attr('href'));
		if (e.which == 78 && $('[rel="next"]').length) ajaxify($('[rel="next"]').attr('href'));
	});
	// Functions
	function random() {
		ajaxify($('.fa-random').parent().attr('href'));
	}
	function playpause() {
		$('video')[0].paused ? $('video')[0].play() : $('video')[0].pause();
	}
	function backward() {
		$('video')[0].currentTime = Math.max($('video')[0].currentTime - 5, 0);
	}
	function forward() {
		$('video')[0].currentTime = Math.min($('video')[0].currentTime + 5, $('video')[0].duration);
	}
	function fulscreen() {
		$('address').toggleFullScreen();
		if ($('body').hasClass('freeze')) $('kbd').hide().parent().removeClass('freeze');
	}
	function favorite(o, m, i) {
		if (i) i.addClass('fa-sun fa-spin').parent().css('pointer-events', 'none');
		$.get(home + 'favorite?o=' + o + (m ? '&m=' + m : ''), function() {
			if (i) i.removeClass('fa-sun fa-spin').toggleClass('far fas').parent().css('pointer-events', 'auto');
		});
	}
	function lurk(e) {
		clearTimeout(conout);
		$('address').css('cursor', 'auto');
		$('bdi').stop(true, true).fadeIn();
		$('pre').addClass('on');
		if (!$('video')[0].paused && !$(e.target).closest('bdi').length) conout = setTimeout(function() {
			$('address').css('cursor', 'none');
			$('bdi').fadeOut();
			$('pre').removeClass('on');
		}, 2000);
	}
	function calculate(d, c) {
		var h = ~~(d / 3600), m = ~~(d % 3600 / 60), s = ~~(c ? d % 60 : d % 3600 % 60);
		return (h ? h + ':' : '') + (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
	}
	function times(e) {
		var match = e.match(/^(?:([0-9]+):)?([0-5][0-9]):([0-5][0-9](?:[.,][0-9]{0,3})?)/);
		return parseFloat(match[3].replace(',', '.')) + 60 * parseInt(match[2], 10) + 60 * 60 * parseInt(match[1] || '0', 10);
	}
	function captionize(e) {
		var str = end = pay = null, cues = [], lines = e.trim().replace('\r\n', '\n').split(/[\r\n]/).map(function(line) {
			return line.trim();
		});
		for (var i = 0; i < lines.length; i++) {
			if (lines[i].indexOf('-->') >= 0) {
				var spl = lines[i].split(/[ \t]+-->[ \t]+/);
				str = times(spl[0]);
				end = times(spl[1]);
			} else if (lines[i] == '') {
				if (str && end) {
					var cue = new VTTCue(str, end, pay);
					cues.push(cue);
					str = end = pay = null;
				}
			} else if (str && end) {
				if (pay == null) pay = lines[i];
				else pay += '\n' + lines[i];
			}
		}
		if (str && end) {
			var cue = new VTTCue(str, end, pay);
			cues.push(cue);
		}
		return cues;
	}
	function ajaxify(u, s) {
		$('main').addClass('on').load(u + ' #content', function() {
			if (!s) {
				history.pushState({}, '', $('#content').attr('data-url').replace(location.origin, ''));
				$('html, body').animate({scrollTop: 0});
			}
			injection();
			$(document).attr('title', $('#content').attr('data-title'));
			$('main, header .on, .genres .on').removeClass('on');
			$('nav:visible').slideUp();
			$('.genres a[href="' + u.replace(/\?(.*)/, '') + '"]').addClass('on');
		});
	}
	function injection() {
		if ($('video').length) {
			if (inline) $('video').attr({controls: true, playsinline: true}).next().remove();
			else $('video').on('click', playpause);
			if ($('video[id]').length) {
				var track = $('video')[0].addTextTrack('subtitles');
				if (inline) track.mode = 'showing';
				else track.mode = 'hidden';
				$.get('https://raw.githubusercontent.com/memres/film/master/cc/' + $('video').attr('id') + '.srt', function(e) {
					captionize(e).map(function(cue) {
						track.addCue(cue);
					});
				});
				var cues = inline ? null : track.cues;
				if (!inline) $('bdo').before('<pre></pre>');
			}
			$('figure').slider({
				step: .001,
				value: $('video')[0].currentTime,
				slide: function(event, ui) {
					$('video')[0].currentTime = ($('video')[0].duration / 100) * ui.value;
				}
			});
			$('.ui-slider-handle').off('keydown');
			$('video').on('volumechange', function() {
				clearTimeout(volout);
				$('bdo').stop(true, true).show().html('<i class="fas fa-volume-' + ($('video')[0].volume == 0 || $('video')[0].muted ? 'mute' : ($('video')[0].volume <= 0.5 ? 'down' : 'up')) + '"></i> ' + ($('video')[0].muted ? '0' : Math.round($('video')[0].volume * 100)));
				volout = setTimeout(function() {
					$('bdo').fadeOut();
				}, 1000);
			});
			$('video').on('loadedmetadata', function() {
				$('.end').text(calculate($('video')[0].duration));
				if ($('[for="autoplay"] i').hasClass('fa-toggle-on')) playpause();
				if ('mediaSession' in navigator) {
					navigator.mediaSession.metadata = new MediaMetadata({
						title: $('h4').text(),
						artist: $('h5 a:first').text(),
						artwork: [{
							src: $('video').attr('poster').replace('/w1280/', '/w400/'),
							sizes: '400x225',
							type: 'image/jpg'
						}]
					});
					navigator.mediaSession.setActionHandler('seekbackward', backward);
					navigator.mediaSession.setActionHandler('seekforward', forward);
				}
				for (var i in cues) {
					var cue = cues[i];
					cue.onenter = function() {
						$('pre').html(this.text).show();
					}
					cue.onexit = function() {
						$('pre').hide();
					}
				}
			});
			$('video').on('timeupdate', function() {
				$('.now').text(calculate($('video')[0].currentTime, true));
				$('.progress').css('width', (($('video')[0].currentTime / $('video')[0].duration) * 100) + '%');
			});
			$('video').on('progress', function() {
				if ($('video')[0].duration) {
					for (var i = 0; i < $('video')[0].buffered.length; i++) {
						if ($('video')[0].buffered.start($('video')[0].buffered.length - 1 - i) < $('video')[0].currentTime) {
							$('.buffer').css('width', ($('video')[0].buffered.end($('video')[0].buffered.length - 1 - i) / $('video')[0].duration) * 100 + '%');
							break;
						}
					}
				}
			});
			$('video').on('play', function() {
				$('bdi i:eq(0)').attr('class', 'fas fa-pause');
			});
			$('video').on('pause', function() {
				$('bdi i:eq(0)').attr('class', 'fas fa-play');
			});
			$('video').on('ended', function() {
				$('bdi i:eq(0)').attr('class', 'fas fa-play');
				if ($('[for="infinite"] i').hasClass('fa-toggle-on')) random();
			});
			$('video').on('play', lurk);
			$('video').on('pause', lurk);
			$('video').on('ended', lurk);
			$('video').on('seeking', lurk);
		}
		if ($('.favorites').length) {
			clear = $('aside').html();
			$('.favorites').sortable({
				handle: 'small',
				items: 'article',
				update: function() {
					let list = '';
					$('article').each(function(i, e) {
						list += $('b', e).attr('id') + ',';
					});
					favorite('sort', list.replace(/,$/, ''));
				}
			});
			$('.favorites').disableSelection();
		}
	}
});
