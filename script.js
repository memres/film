$(function() {
	var conout, volout, titles, player = $('video')[0], home = $('h1 a').attr('href'), cleared = '<h3>Your favorites list<br/> <span>has been cleared</span></h3>', poster = /https\:\/\/image\.tmdb\.org\/t\/p\/w300_and_h450_bestv2\/|\.jpg/g;
	if ($('[name="favorites"]').attr('content').length) {
		if (player && new RegExp($('[property="og:image"]').attr('content').replace(poster, '')).test($('[name="favorites"]').attr('content'))) $('h5 b i').toggleClass('far fas');
		if ($('article').length && !$('.favorites').length) $('article b').each(checkfav);
	}
	$(window).on('beforeunload', function() {
		$('header h1 i').addClass('fa-spin');
		setTimeout(function() {
			$('header h1 i').removeClass('fa-spin')
		}, 10000);
	});
	$('.search form').on('submit', function() {
		$('i', this).addClass('fa-spinner fa-spin');
	});
	$('.login form').on('submit', function(e) {
		e.preventDefault();
		let t = $(this), b = t.find('button').html();
		$.ajax({
			type: 'POST',
			url: home + 'login',
			data: t.serialize(),
			beforeSend: function() {
				t.find('button i').addClass('fa-spinner fa-spin').parent().css('pointer-events', 'none');
			},
			success: function(r) {
				if (r) {
					let style = {'color': '#f44', 'text-shadow': '0 0 1px #000'};
					t.find('i').attr('class', 'fas fa-ban').css(style).next().text('Invalid ' + r).css(style).fadeTo(250,0).fadeTo(250,1).fadeTo(250,0).fadeTo(250,1);
					setTimeout(function() {
						t.find('button').html(b).css('pointer-events', 'auto');
					}, 3000);
				}
				else location.reload();
			}
		});
	});
	$('.settings button').on('click', function() {
		let t = $(this);
		$.ajax({
			url: home + 'logout',
			beforeSend: function() {
				t.find('button i').addClass('fa-spinner fa-spin').parent().css('pointer-events', 'none');
			},
			success: function() {
				location.reload();
			}
		});
	});
	$('.settings label').on('click', function() {
		let t = $(this);
		$.ajax({
			url: home + 'update',
			data: 'f=' + t.attr('for') + '&v=' + (t.find('i').hasClass('fa-toggle-off') ? 'true' : 'false'),
			beforeSend: function() {
				t.css('pointer-events', 'none').find('i').addClass('fa-spin');
			},
			success: function() {
				t.css('pointer-events', 'auto').find('i').removeClass('fa-spin').toggleClass('fa-toggle-off fa-toggle-on');
			}
		});
	});
	$('header li a:lt(3)').on('click', function() {
		if ($('header li a:lt(3)').not(this).hasClass('on')) {
			$('header li a:lt(3).on').removeClass('on');
			$('nav').fadeOut();
		}
		$(this).toggleClass('on');
		$('.' + $(this).attr('id')).slideToggle();
		if ($('#search').hasClass('on')) {
			if (!titles) {
				$('.search form').attr('action', home);
				$.getJSON(home + 'titles', function(e) {
					titles = e;
					$('.search input').autocomplete({
						minLength: 2,
						source: titles,
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
		if ($('#login').hasClass('on')) {
			setTimeout(function() {
				$('#u').focus();
			}, 400);
		}
	});
	$('figure').on('mousemove', function(e) {
		if (player.duration) {
			var ratio = (((e.pageX - ($('figure')[0].getBoundingClientRect().left + document.body.scrollLeft)) / $('figure').width()) * 100);
			$('.stamp').show().css('left', ratio + '%').text(calculate((player.duration * ratio) / 100));
		}
	});
	$('figure').on('mouseout', function(e) {
		$('.stamp').hide();
	});
	if (player) {
		if ('mediaSession' in navigator) {
			navigator.mediaSession.metadata = new MediaMetadata({
				title: $('h4').text(),
				artist: $('h5 a').text(),
				artwork: [{
					src: $('video').attr('poster').replace('original', 'w400'),
					sizes: '320x180',
					type: 'image/jpg'
				}]
			});
			navigator.mediaSession.setActionHandler('seekbackward', backward);
			navigator.mediaSession.setActionHandler('seekforward', forward);
		}
		$('figure').slider({
			step: .001,
			value: player.currentTime,
			slide: function(event, ui) {
				player.currentTime = (player.duration / 100) * ui.value;
			}
		});
		$('.ui-slider-handle').off('keydown');
		if (player.hasAttribute('id')) {
			var track = player.addTextTrack('subtitles');
			track.mode = 'showing';
			$.ajax({
				url: 'https://raw.githubusercontent.com/memres/film/master/cc/' + $('video').attr('id') + '.srt',
				complete: function(e) {
					captions(e.responseText).map(function(cue) {
						track.addCue(cue);
					});
				}
			});
		}
	}
	$('video').on('contextmenu', function() {
		return false;
	});
	$('video').on('volumechange', function() {
		clearTimeout(volout);
		$('kbd').stop(true, true).show().find('i').attr('class', 'fas fa-volume-' + (player.volume == 0 || player.muted ? 'mute' : (player.volume <= 0.5 ? 'down' : 'up'))).next().text(player.muted ? '0' : Math.round(player.volume * 100));
		volout = setTimeout(function() {
			$('kbd').fadeOut();
		}, 1000);
	});
	$('video').on('loadedmetadata', function() {
		$('.end').text(calculate(player.duration));
		if ($('[for="autoplay"] i').hasClass('fa-toggle-on')) playpause();
	});
	$('video').on('timeupdate', function() {
		$('.now').text(calculate(player.currentTime, true));
		$('.progress').css('width', ((player.currentTime / player.duration) * 100) + '%');
	});
	$('video').on('progress', function() {
		if (player.duration) {
			for (var i = 0; i < player.buffered.length; i++) {
				if (player.buffered.start(player.buffered.length - 1 - i) < player.currentTime) {
					$('.buffer').css('width', (player.buffered.end(player.buffered.length - 1 - i) / player.duration) * 100 + '%');
					break;
				}
			}
		}
	});
	$('video').on('ended', function() {
		lurk();
		$('bdi i:eq(0)').attr('class', 'fas fa-play');
		if ($('[for="infinite"] i').hasClass('fa-toggle-on')) random();
	});
	$('video').on('play', lurk);
	$('video').on('pause', lurk);
	$('address').on('mousemove', lurk);
	$('address').on('mousedown', lurk);
	$('address').on('touchmove', lurk);
	$('address').on('mousewheel', lurk);
	$('address').on('MSPointerMove', lurk);
	$('address').on('DOMMouseScroll', lurk);
	$('video, bdi i:eq(0)').on('click', playpause);
	$('bdi i:eq(1)').on('click', tfs);
	$('.favorites').sortable({
		handle: 'small',
		items: 'article',
		update: function() {
			let list = '';
			$('article').each(function(i, e) {
				list += $('a', e).attr('href').replace(home + 'movie/', '') + '჻' + $('span', e).text() + '჻' + $('img', e).attr('src').replace(poster, '') + '፨';
			});
			$('[name="favorites"]').attr('content', list);
			editfav();
		}
	});
	$('.favorites').disableSelection();
	$(document).on('click', '.favorites aside a', function() {
		if ($(this).hasClass('prev')) {
			$('[name="favorites"]').attr('content', '');
			$('main').html(cleared);
			editfav();
		}
		else if ($(this).hasClass('next')) $('aside').html('<a><i class="fas fa-trash"></i> Clear</a>');
		else $('aside').html('<a class="prev"><i class="far fa-check-circle"></i> Yes</a><a class="next"><i class="far fa-times-circle"></i> No</a>');
	});
	$(document).on('click', 'article b', function(e) {
		e.preventDefault();
		heart($('i', this), $(this).parent().attr('href').replace(home + 'movie/', '') + '჻' + $(this).prev().text() + '჻' + $(this).next().attr('src').replace(poster, '') + '፨');
		if ($('.favorites').length) {
			$(this).parents('article').fadeOut();
			if (!$('[name="favorites"]').attr('content').length) $('main').html(cleared);
		}
	});
	$('h5 b').on('click', function() {
		heart($('i', this), $('[property="og:url"]').attr('content').replace(home + 'movie/', '') + '჻' + $('h4').text() + '჻' + $('[property="og:image"]').attr('content').replace(poster, '') + '፨');
	});
	$('.similar').on('click', function() {
		let t = $(this);
		$.ajax({
			url: home + 'similar',
			data: 'm=' + t.attr('data-movie'),
			beforeSend: function() {
				t.css('pointer-events', 'none').find('i').addClass('fa-spinner fa-spin');
			},
			success: function(e) {
				$('section').html(e).before('<h2>Similar Movies</h2>');
				if ($('[name="favorites"]').attr('content').length) $('article b').each(checkfav);
			}
		});
	});
	$('footer i:eq(3)').on('click', function() {
		$('html, body').animate({scrollTop: 0});
	});
	$('footer i:eq(0), .keyboard').on('click', keyboard);
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
		if (player) {
			if (e.which == 32) playpause();
			if (e.which == 70) tfs();
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
		}
		if (e.which == 13) random();
		if (e.which == 66 && $('[rel="prev"]').length) location.href = $('[rel="prev"]').attr('href');
		if (e.which == 78 && $('[rel="next"]').length) location.href = $('[rel="next"]').attr('href');
		if (e.which == 75 && !$(document).fullScreen()) keyboard();
	});
	$(document).on('fullscreenchange', function() {
		if ($(document).fullScreen()) {
			$('bdi i:eq(1)').attr('class', 'fas fa-compress');
			if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) screen.orientation.lock('landscape');
		}
		else $('bdi i:eq(1)').attr('class', 'fas fa-expand');
	});
	function tfs() {
		$('address').toggleFullScreen();
		if ($('body').hasClass('freeze')) $('.keyboard').hide().parent().removeClass('freeze');
	}
	function keyboard() {
		$('body').hasClass('freeze') ? $('.keyboard').hide().parent().removeClass('freeze') : $('.keyboard').show().parent().addClass('freeze');
	}
	function backward() {
		player.currentTime = player.currentTime - 5;
	}
	function forward() {
		player.currentTime = player.currentTime + 5;
	}
	function random() {
		location.href = $('.fa-random').parent().attr('href');
	}
	function heart(i, e) {
		if (i.hasClass('far')) $('[name="favorites"]').attr('content', e + $('[name="favorites"]').attr('content'));
		else $('[name="favorites"]').attr('content', $('[name="favorites"]').attr('content').replace(e, ''));
		editfav(i);
	}
	function editfav(i) {
		$.ajax({
			url: home + 'update',
			data: 'f=favorites&v=' + $('[name="favorites"]').attr('content'),
			beforeSend: function() {
				if (i) i.addClass('fa-sun fa-spin').parent().css('pointer-events', 'none');
			},
			success: function() {
				if (i) i.removeClass('fa-sun fa-spin').toggleClass('far fas').parent().css('pointer-events', 'auto');
			}
		});
	}
	function checkfav() {
		if (new RegExp($(this).next().attr('src').replace(poster, '')).test($('[name="favorites"]').attr('content'))) $('i', this).toggleClass('far fas');
	}
	function playpause() {
		if (player.paused) {
			player.play();
			$('bdi i:eq(0)').attr('class', 'fas fa-pause');
		}
		else {
			player.pause();
			$('bdi i:eq(0)').attr('class', 'fas fa-play');
		}
	}
	function lurk(e) {
		clearTimeout(conout);
		$('address').css('cursor', 'auto');
		$('bdi').stop(true, true).fadeIn();
		if (!player.paused && !$(e.target).not('bdi *:last-child').is('bdi *')) conout = setTimeout(function() {
			$('address').css('cursor', 'none');
			$('bdi').fadeOut();
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
	function captions(e) {
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
});
