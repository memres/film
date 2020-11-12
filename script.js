$(document).ready(function() {
	var clear, player, conout, volout, home = $('h1 a').attr('href'), cleared = '<h3>Your favorites list<div>has been cleared</div></h3>';
	injection();
	$('header li a:lt(3)').on('click', function() {
		if ($('header a').not(this).hasClass('on')) {
			$('header .on').removeClass('on');
			$('nav:visible').fadeOut();
		}
		$(this).toggleClass('on');
		$('.'+$(this).attr('id')).slideToggle();
		if ($(this).is('#search.on')) {
			if (!$('.search').hasClass('ok')) {
				$('.search').addClass('ok').children('form').attr('action', home);
				$.getJSON(home+'titles', function(e) {
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
	$('.login form').on('submit', function(e) {
		e.preventDefault();
		let t = $(this), b = $('button', this), c = b.html();
		b.children('i').addClass('fa-spinner fa-spin').parent().css('pointer-events', 'none');
		$.post(home+'login', t.serialize(), function(e) {
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
		$.get(home+'logout', function() {
			location.reload();
		});
	});
	$('.settings label').on('click', function() {
		let t = $(this);
		t.css('pointer-events', 'none').children('i').addClass('fa-spin');
		$.get(home+'toggle?o='+t.attr('for')+'&b='+(t.children('i').hasClass('fa-toggle-off') ? 'true' : 'false'), function() {
			t.css('pointer-events', 'auto').children('i').removeClass('fa-spin').toggleClass('fa-toggle-off fa-toggle-on');
		});
	});
	$('.search form').on('submit', function(e) {
		e.preventDefault();
		navigator.vibrate(50);
		ajaxify(home+'?'+$(this).serialize().replace(/%20/g, '+'));
	});
	$('.fa-chevron-up').on('click', function() {
		$('html, body').animate({scrollTop: 0});
	});
	$('.fa-keyboard').on('click', function() {
		$('body').addClass('off').children('header, nav, main, footer').addClass('hide');
		$('kbd').show();
	});
	$('kbd').on('click', defrost);
	$(document).on('click', 'article b, h5 b', function() {
		let i = $('i', this);
		favorite(i.hasClass('far') ? 'add' : 'remove', $(this).attr('id'), i);
		if ($('.favorites').length) {
			let t = $(this).parents('article');
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
	$(document).on('click', '[data-movie]', function() {
		let t = $(this);
		t.css('pointer-events', 'none').children('i').addClass('fa-spinner fa-spin');
		$.get(home+'similar?m='+t.attr('data-movie'), function(e) {
			$('section').html(e);
		});
	});
	$(document).on('mousemove', 'figure', function(e) {
		if (player.duration) {
			let ratio = ((e.pageX - ($('figure')[0].getBoundingClientRect().left + document.body.scrollLeft)) / $('figure').width()) * 100;
			$('.stamp').show().css('left', ratio+'%').text(calculate((player.duration * ratio) / 100));
		}
	});
	$(document).on('mouseout', 'figure', function() {
		$('.stamp').hide();
	});
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
	$(document).on('click', 'bdi i:nth-of-type(1)', playpause);
	$(document).on('click', 'bdi i:nth-of-type(2)', fullscreen);
	$(document).on('contextmenu', 'video', function(e) {
		e.preventDefault();
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
		if (player) {
			if (e.which == 32) return false;
			if (e.which == 37) backward();
			if (e.which == 39) forward();
			if (e.which == 109 && player.volume > 0) player.volume = (Math.round(player.volume * 100) - 5) / 100;
			if (e.which == 107 && player.volume < 1) player.volume = (Math.round(player.volume * 100) + 5) / 100;
		}
	});
	$(window).on('keyup', function(e) {
		if ($(e.target).is('INPUT')) return;
		if (e.which == 13) random();
		if (e.which == 27 && $('main').hasClass('hide')) defrost();
		if (e.which == 66 && $('[rel="prev"]').length) ajaxify($('[rel="prev"]').attr('href'));
		if (e.which == 78 && $('[rel="next"]').length) ajaxify($('[rel="next"]').attr('href'));
		if (player) {
			if (e.which == 32) playpause();
			if (e.which == 70) fullscreen();
			if (e.which == 77) player.muted = !player.muted;
			if (e.which == 80 && document.pictureInPictureEnabled) document.pictureInPictureElement ? document.exitPictureInPicture() : player.requestPictureInPicture();
			if (e.which == 48 || e.which == 96) player.currentTime = 0;
			if (e.which == 49 || e.which == 97) player.currentTime = .1 * player.duration;
			if (e.which == 50 || e.which == 98) player.currentTime = .2 * player.duration;
			if (e.which == 51 || e.which == 99) player.currentTime = .3 * player.duration;
			if (e.which == 52 || e.which == 100) player.currentTime = .4 * player.duration;
			if (e.which == 53 || e.which == 101) player.currentTime = .5 * player.duration;
			if (e.which == 54 || e.which == 102) player.currentTime = .6 * player.duration;
			if (e.which == 55 || e.which == 103) player.currentTime = .7 * player.duration;
			if (e.which == 56 || e.which == 104) player.currentTime = .8 * player.duration;
			if (e.which == 57 || e.which == 105) player.currentTime = .9 * player.duration;
			if (e.which == 110 || e.which == 223) player.currentTime = player.duration;
		}
	});
	function random() {
		ajaxify($('.fa-random').parent().attr('href'));
	}
	function playpause() {
		player.paused ? player.play() : player.pause();
	}
	function backward() {
		player.currentTime = Math.max(player.currentTime - 5, 0);
	}
	function forward() {
		player.currentTime = Math.min(player.currentTime + 5, player.duration);
	}
	function defrost() {
		$('kbd').hide();
		$('body').removeClass('off').children('header, nav, main, footer').removeClass('hide');
	}
	function fullscreen() {
		if (document.fullscreenElement) {
			document.exitFullscreen();
			$('bdi i:nth-of-type(2)').attr('class', 'fas fa-expand');
		}
		else {
			document.querySelector('address').requestFullscreen({navigationUI: 'hide'});
			if (/Android/i.test(navigator.userAgent)) screen.orientation.lock('landscape');
			$('bdi i:nth-of-type(2)').attr('class', 'fas fa-compress');
			if ($('main').hasClass('hide')) defrost();
		}
	}
	function favorite(o, m, i) {
		if (i) i.addClass('fa-sun fa-spin').parent().css('pointer-events', 'none');
		$.get(home+'favorite?o='+o+(m ? '&m='+m : ''), function() {
			if (i) i.removeClass('fa-sun fa-spin').toggleClass('far fas').parent().css('pointer-events', 'auto');
		});
	}
	function lurk(e) {
		clearTimeout(conout);
		$('address').css('cursor', 'auto');
		$('bdi').stop(true, true).fadeIn();
		$('pre').addClass('on');
		if (!player.paused && !$(e.target).closest('bdi').length) conout = setTimeout(function() {
			$('address').css('cursor', 'none');
			$('bdi').fadeOut();
			$('pre').removeClass('on');
		}, 2000);
	}
	function calculate(d, c) {
		let h = ~~(d / 3600), m = ~~(d % 3600 / 60), s = ~~(c ? d % 60 : d % 3600 % 60);
		return (h ? h+':' : '')+(m < 10 ? '0'+m : m)+':'+(s < 10 ? '0'+s : s);
	}
	function times(e) {
		let m = e.match(/^(?:([0-9]+):)?([0-5][0-9]):([0-5][0-9](?:[.,][0-9]{0,3})?)/);
		return parseFloat(m[3].replace(',', '.')) + 60 * parseInt(m[2], 10) + 60 * 60 * parseInt(m[1] || '0', 10);
	}
	function captionize(e) {
		let str = end = pay = null, cues = [], lines = e.trim().replace('\r\n', '\n').split(/[\r\n]/).map(function(line) {
			return line.trim();
		});
		for (let i = 0; i < lines.length; i++) {
			if (lines[i].indexOf('-->') >= 0) {
				let spl = lines[i].split(/[ \t]+-->[ \t]+/);
				str = times(spl[0]);
				end = times(spl[1]);
			} else if (lines[i] == '') {
				if (str && end) {
					let cue = new VTTCue(str, end, pay);
					cues.push(cue);
					str = end = pay = null;
				}
			} else if (str && end) {
				if (pay == null) pay = lines[i];
				else pay += '\n'+lines[i];
			}
		}
		if (str && end) {
			let cue = new VTTCue(str, end, pay);
			cues.push(cue);
		}
		return cues;
	}
	function ajaxify(u, s) {
		$('main').addClass('on').load(u+' #content', function() {
			let p = $('#content').attr('data-page'), t = $('#content').attr('data-title');
			if (!s) {
				history.pushState({}, '', p.replace(location.origin, ''));
				$('html, body').animate({scrollTop: 0});
			}
			document.title = t;
			injection();
			$('main, header .on, .menu .on').removeClass('on');
			$('nav:visible').slideUp();
			$('.menu a[href="'+p.replace(/\?(.*)/, '')+'"]').addClass('on');
			if (typeof ga !== "undefined") {
				ga('send', 'pageview', {'page': p, 'title': t});
				$('.counter').attr('src', 'https://c.statcounter.com/t.php?sc_project=9421647&security=cfd47c32&invisible=1&camefrom='+encodeURIComponent($('.counter').attr('alt'))+'&u='+encodeURIComponent(location.href)+'&t='+encodeURIComponent(t)+'&resolution='+screen.width+'&h='+screen.height);
			}
		});
	}
	function injection() {
		if ($('video').length) {
			player = $('video')[0];
			let inline = /iPhone|iPad|Smart/i.test(navigator.userAgent);
			if (inline) $('video').attr({controls: true, playsinline: true}).next().remove();
			else $('video').on('click', playpause);
			if ($('video[id]').length) {
				let track = player.addTextTrack('subtitles');
				if (inline) track.mode = 'showing';
				else track.mode = 'hidden';
				$.get('https://raw.githubusercontent.com/memres/film/master/cc/'+$('video').attr('id')+'.srt', function(e) {
					captionize(e).map(function(cue) {
						track.addCue(cue);
					});
				});
				var cues = inline ? null : track.cues;
				if (!inline) $('bdo').before('<pre></pre>');
			}
			$('figure').slider({
				step: .001,
				value: player.currentTime,
				slide: function(event, ui) {
					player.currentTime = (player.duration / 100) * ui.value;
				}
			});
			$('.ui-slider-handle').off('keydown');
			$('video').on('volumechange', function() {
				clearTimeout(volout);
				$('bdo').stop(true, true).show().html('<i class="fas fa-volume-'+(player.volume == 0 || player.muted ? 'mute' : (player.volume <= 0.5 ? 'down' : 'up'))+'"></i> '+(player.muted ? '0' : Math.round(player.volume * 100)));
				volout = setTimeout(function() {
					$('bdo').fadeOut();
				}, 1000);
			});
			$('video').on('loadedmetadata', function() {
				$('.end').text(calculate(player.duration));
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
					navigator.mediaSession.setActionHandler('seekforward', forward);
					navigator.mediaSession.setActionHandler('seekbackward', backward);
				}
				for (let i in cues) {
					let cue = cues[i];
					cue.onenter = function() {
						$('pre').html(this.text).show();
					}
					cue.onexit = function() {
						$('pre').hide();
					}
				}
			});
			$('video').on('timeupdate', function() {
				$('.now').text(calculate(player.currentTime, true));
				$('.progress').css('width', ((player.currentTime / player.duration) * 100)+'%');
			});
			$('video').on('progress', function() {
				if (player.duration) {
					for (let i = 0; i < player.buffered.length; i++) {
						if (player.buffered.start(player.buffered.length - 1 - i) < player.currentTime) {
							$('.buffer').css('width', (player.buffered.end(player.buffered.length - 1 - i) / player.duration) * 100+'%');
							break;
						}
					}
				}
			});
			$('video').on('play', function() {
				$('bdi i:nth-of-type(1)').attr('class', 'fas fa-pause');
			});
			$('video').on('pause', function() {
				$('bdi i:nth-of-type(1)').attr('class', 'fas fa-play');
			});
			$('video').on('ended', function() {
				$('bdi i:nth-of-type(1)').attr('class', 'fas fa-play');
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
						list += $('b', e).attr('id')+',';
					});
					favorite('sort', list.replace(/,$/, ''));
				}
			});
			$('.favorites').disableSelection();
		}
	}
});
