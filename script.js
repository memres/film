$(function() {
	var conout, volout, movies, player = $('video')[0], home = $('h1 a').attr('href'), cleared = '<h3>Your favorites list<br/> <span>has been cleared</span></h3>', poster = /https\:\/\/image\.tmdb\.org\/t\/p\/w300_and_h450_bestv2\/|\.jpg/g;
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
	$('.settings form').on('submit', function(e) {
		e.preventDefault();
		let t = $(this), b = t.find('button').html();
		$.ajax({
			type: 'POST',
			url: home + 'sign',
			data: $('#u').length ? t.serialize() : '',
			beforeSend: function() {
				t.find('i').addClass('fa-spinner fa-spin').parent().css('pointer-events', 'none');
			},
			success: function(e) {
				if (e) {
					let style = {'color': '#f44', 'text-shadow': '0 0 1px #000'};
					t.find('i').attr('class', 'fas fa-ban').css(style).next().text('Invalid ' + e).css(style).fadeTo(250,0).fadeTo(250,1).fadeTo(250,0).fadeTo(250,1);
					setTimeout(function() {
						t.find('button').html(b).css('pointer-events', 'auto');
					}, 3000);
				}
				else location.reload();
			}
		});
	});
	$('[for="autoplay"], [for="infinite"]').on('click', function() {
		let t = $(this);
		$.ajax({
			url: home + 'update',
			data: 'p=' + t.attr('for') + '&v=' + (t.find('i').hasClass('fa-toggle-off') ? '1' : '0'),
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
			if (!movies) {
				$('.search form').attr('action', home);
				$.getJSON('https://raw.githubusercontent.com/memres/film/master/titles.json', function(data) {
					movies = data;
					$('#q').autocomplete({
						minLength: 2,
						source: movies,
						select: function(event, ui) {
							$(event.target).val(ui.item.value);
							$('.search form').submit();
						}
					});
				});
			}
			setTimeout(function() {
				$('#q').focus();
			}, 400);
		}
		if ($('#settings').hasClass('on') && $('#u').length) {
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
		if (!player.hasAttribute('src')) $('video').attr('src', 'data:video/mp4;base64, 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');
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
		else player.load();
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
	$('.similar').on('click', function(e) {
		e.preventDefault();
		let t = $(this);
		$.ajax({
			url: home + 'similar',
			beforeSend: function() {
				t.css('pointer-events', 'none').find('i').addClass('fa-spin');
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
			data: 'p=favorites&v=' + $('[name="favorites"]').attr('content'),
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
