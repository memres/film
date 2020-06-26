$(function() {
	var conout, volout, movies, search = $('[type="search"]'), player = $('video')[0];
	Cookies.set('current', location.pathname.replace(/^\//, '').replace(/^film\//, '').replace(/\/+$/, ''));
	if (Cookies.get('auto_play')) $('[name="auto_play"]').attr('checked', true);
	if (Cookies.get('endless_playback')) $('[name="endless_playback"]').attr('checked', true);
	if (localStorage.getItem('favorites')) {
		if (player && new RegExp($('[property="og:image"]').attr('content')).test(localStorage.getItem('favorites'))) $('h5 i').toggleClass('far fas');
		if ($('article').length) $('article b').each(function() {
			if (new RegExp($(this).next().attr('src')).test(localStorage.getItem('favorites'))) $('i', this).toggleClass('far fas');
		});
	}
	if (Cookies.get('current') == 'favorites') {
		if (localStorage.getItem('favorites')) {
			$('main').html('<h2>Favorites</h2><section class="favorites"><aside><a><i class="fas fa-trash"></i> Clear</a></aside></section>');
			localStorage.getItem('favorites').replace(/ဇ፨ჲ$/, '').split('ဇ፨ჲ').reverse().map(function(e) {
				var val = e.split('ჲ፨ဇ');
				$('section').prepend('<article><a href="' + val[0] + '"><small><i class="fas fa-arrows-alt fa-2x"></i></small><span>' + val[1] + '</span><b><i class="fas fa-heart fa-2x"></i></b><img src="' + val[2] + '"/></a></article>');
			});
		}
		else $('main').html('<h3>Add your favorite movies<br/><span>to collect them all here</span></h3>');
	}
	$(window).on('beforeunload', function() {
		$('header h1 i').addClass('fa-spin');
		setTimeout(function() {
			$('header h1 i').removeClass('fa-spin')
		}, 10000);
	});
	$('form').on('submit', function() {
		$('i', this).addClass('fa-spinner fa-spin');
	});
	$(':checkbox').on('change', function() {
		var name = $(this).attr('name');
		this.checked ? Cookies.set(name, 1, {expires: 365}) : Cookies.remove(name);
	});
	$('header li a:lt(3)').on('click', function() {
		if ($('header li a:lt(3)').not(this).hasClass('on')) {
			$('header li a:lt(3).on').removeClass('on');
			$('nav').fadeOut();
		}
		$(this).toggleClass('on');
		$('.' + $(this).attr('id')).slideToggle();
		if ($('#search').hasClass('on')) {
			if (!movies) $.getJSON('https://raw.githubusercontent.com/memres/film/master/titles.json', function(data) {
				movies = data;
				search.autocomplete({
					minLength: 2,
					source: movies,
					select: function(event, ui) {
						$(event.target).val(ui.item.value);
						$('form').submit();
					}
				});
			});
			setTimeout(function() {
				search.focus();
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
				title: $('[property="og:title"]').attr('content'),
				artist: $('h5 a').text(),
				artwork: [{
					src: $('video').attr('poster').replace('original', 'w500'),
					sizes: '320x180',
					type: 'image/jpg'
				}]
			});
			navigator.mediaSession.setActionHandler('seekbackward', backward);
			navigator.mediaSession.setActionHandler('seekforward', forward);
			navigator.mediaSession.setActionHandler('previoustrack', prev);
			navigator.mediaSession.setActionHandler('nexttrack', next);
		}
		$('figure').slider({
			step: .001,
			value: player.currentTime,
			slide: function(event, ui) {
				player.currentTime = (player.duration / 100) * ui.value;
			}
		});
		$('.ui-slider-handle').off('keydown');
		if (Cookies.get('volume') < 1) player.volume = Cookies.get('volume');
		if (player.hasAttribute('id')) {
			var track = player.addTextTrack('subtitles');
			track.mode = 'showing';
			$.ajax({
				url: 'https://raw.githubusercontent.com/memres/film/master/cc/' + $('video').attr('id') + '.srt',
				complete: function(data) {
					captions(data.responseText).map(function(cue) {
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
		if (Cookies.get('auto_play')) playpause();
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
		if (Cookies.get('endless_playback')) random();
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
				list += $('a', e).attr('href') + 'ჲ፨ဇ' + $('span', e).text() + 'ჲ፨ဇ' + $('img', e).attr('src') + 'ဇ፨ჲ';
			});
			localStorage.setItem('favorites', list);
		}
	});
	$('.favorites').disableSelection();
	$(document).on('click', '.favorites aside a', function() {
		if ($(this).hasClass('prev')) {
			localStorage.removeItem('favorites');
			$('main').html('<h3>Your favorites list<br/><span>has been cleared</span></h3>');
		}
		else if ($(this).hasClass('next')) $('aside').html('<a><i class="fas fa-trash"></i> Clear</a>');
		else $('aside').html('<a class="prev"><i class="fas fa-check"></i> Yes</a><a class="next"><i class="fas fa-times"></i> No</a>');
	});
	$('article b').on('click', function(e) {
		e.preventDefault();
		var i = $('i', this);
		heart(i, $(this).parent().attr('href') + 'ჲ፨ဇ' + $(this).prev().text() + 'ჲ፨ဇ' + $(this).next().attr('src') + 'ဇ፨ჲ');
		if ($('.favorites').length) $(this).parents('article').fadeOut();
	});
	$('h5 b').on('click', function() {
		var i = $('i', this);
		heart(i, $('[property="og:url"]').attr('content') + 'ჲ፨ဇ' + $('h4').text() + 'ჲ፨ဇ' + $('[property="og:image"]').attr('content') + 'ဇ፨ჲ');
	});
	$('footer i:eq(3)').on('click', function() {
		$('html, body').animate({scrollTop: 0});
	});
	$('footer i:eq(0), .keyboard').on('click', keyboard);
	$(window).on('keydown', function(e) {
		if ($(e.target).is('INPUT')) return;
		if (player) {
			if (e.which == 32) return false;
			if (e.which == 37) player.currentTime = player.currentTime - 5;
			if (e.which == 39) player.currentTime = player.currentTime + 5;
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
			if (e.which == 107 || e.which == 109) Cookies.set('volume', Math.round(player.volume * 100) / 100, {expires: 365});
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
	function prev() {
		if ($('[rel="prev"]').length) location.href = $('[rel="prev"]').attr('href');
	}
	function next() {
		if ($('[rel="next"]').length) location.href = $('[rel="next"]').attr('href');
	}
	function random() {
		location.href = $('.fa-random').parent().attr('href');
	}
	function heart(i, e) {
		if (i.hasClass('far')) localStorage.setItem('favorites', (localStorage.getItem('favorites') ? localStorage.getItem('favorites') + e : e));
		else {
			localStorage.setItem('favorites', localStorage.getItem('favorites').replace(e, ''));
			if (localStorage.getItem('favorites') == '') localStorage.removeItem('favorites');
		}
		i.toggleClass('far fas');
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
