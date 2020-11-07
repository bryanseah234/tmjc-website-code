/* vim: ts=2

Title:		jShowOff: a jQuery Content Rotator Plugin
Author:		Erik Kallevig
Version:	0.1.2
Website:	http://ekallevig.com/jshowoff
License: 	Dual licensed under the MIT and GPL licenses.

jShowOff Options

animatePause :		whether to use 'Pause' animation text when pausing [boolean, defaults to true]
autoPlay :			whether to start playing immediately [boolean, defaults to true]
changeSpeed :		speed of transition [integer, milliseconds, defaults to 600]
controls :			whether to create & display controls (Play/Pause, Previous, Next) [boolean, defaults to true]
controlText :		custom text for controls [object, 'play', 'pause', 'previous' and 'next' properties]
cssClass :			custom class to add to .jshowoff wrapper [string]
effect :			transition effect [string: 'fade', 'slideLeft' or 'none', defaults to 'fade']
hoverPause :		whether to pause on hover [boolean, defaults to true]
links :				whether to create & display numeric links to each slide [boolean, defaults to true]
speed :				time each slide is shown [integer, milliseconds, defaults to 3000]

*/

(function($) {


	$.fn.jshowoff = function(settings) {

		// default global vars
		var config = {
			animatePause : true,
			autoPlay : true,
			changeSpeed : 600,
			controls : true,
			controlText : {
				play :		'&raquo;',
				pause :		'&raquo;',
				next :		'&gt;',
				previous :	'&lt;'
			},
			effect : 'fade',
			hoverPause : false,
			links : true,
			speed : 3000
		};
		if (!window.jsocount) window.jsocount=0;
		window.jsocount++;
		var myjsocount=window.jsocount;
		
		// merge default global variables with custom variables, modifying 'config'
		if (settings) $.extend(true, config, settings);

		// make sure speed is at least 20ms longer than changeSpeed
		if (config.speed < (config.changeSpeed+20)) {
			alert('jShowOff: Make speed at least 20ms longer than changeSpeed; the fades aren\'t always right on time.');
			return this;
		};
		
		// create slideshow for each matching element invoked by .jshowoff()
		this.each(function(i) {
			
			// declare instance variables
			var $cont = $(this);
			var gallery = $(this).children().remove();
			var timer = '';
			var counter = 0;
			var preloadedImg = [];
			var uniqueClass='xxx';
//			var howManyInstances = $('.jshowoff').length+1;
//			var uniqueClass = 'jshowoff-'+howManyInstances;
			var cssClass = config.cssClass != undefined ? config.cssClass : '';
			
			
			// set up wrapper
			$cont.css('position','relative').wrap('<div class="jshowoff"/>');
			var $wrap = $cont.closest('.jshowoff');
			$wrap.css('position','relative').addClass(cssClass);
			
			// add first slide to wrapper
			$(gallery[0]).clone().appendTo($cont);
			
			// preload slide images into memory
			preloadImg();
			
			// add controls
			if(config.controls){
				addControls();
				if(config.autoPlay==false){
					$('.play_',$wrap).addClass('paused_').html(config.controlText.play);
				};
			};
			
			// add slide links
			if(config.links){
				addSlideLinks();
				$('.slidelinks_ div',$wrap).eq(0).addClass('active_');
			};
			
			// pause slide rotation on hover
			if(config.hoverPause){ $cont.hover(
				function(){ if(isPlaying()) pause('hover'); },
				function(){ if(isPlaying()) play('hover'); }
			);};
			
			// determine autoPlay
			if(config.autoPlay && gallery.length>1) {
				timer = setInterval( 
				  function(){ 
					  play(); 
						/*console.log('setInterval',myjsocount);*/ 
					}, config.speed 
				);
			};
			
			// display error message if no slides present
			if(gallery.length<1){
// 2012-06-11 joel: no message 
//				$wrap.append('<div>For jShowOff to work, the container element must have child elements.</div>');
			};

			
			// utility for loading slides
			function transitionTo(gallery,index) {
				
				var oldCounter = counter;
				if((counter >= gallery.length) || (index >= gallery.length)) { counter = 0; var e2b = true; }
				else if((counter < 0) || (index < 0)) { counter = gallery.length-1; var b2e = true; }
				else { counter = index; }


				if(config.effect=='slideLeft'){
					var newSlideDir, oldSlideDir;
					function slideDir(dir) {
						newSlideDir = dir=='right' ? 'left' : 'right';
						oldSlideDir = dir=='left' ? 'left' : 'right';					
					};
					

					counter >= oldCounter ? slideDir('left') : slideDir('right') ;

					$(gallery[counter]).clone().appendTo($cont).slideIt({direction:newSlideDir,changeSpeed:config.changeSpeed});
					if($cont.children().length>1){
						$cont.children().eq(0).css('position','absolute').slideIt({direction:oldSlideDir,showHide:'hide',changeSpeed:config.changeSpeed},function(){$(this).remove();});
					};
				} else if (config.effect=='fade') {
					$(gallery[counter]).clone().appendTo($cont).hide().fadeIn(config.changeSpeed,function(){if($.browser.msie)this.style.removeAttribute('filter');});
					if($cont.children().length>1){
						$cont.children().eq(0).css('position','absolute').fadeOut(config.changeSpeed,function(){$(this).remove();});
					};
				} else if (config.effect=='none') {
					$(gallery[counter]).clone().appendTo($cont);
					if($cont.children().length>1){
						$cont.children().eq(0).css('position','absolute').remove();
					};
				};

				$('.pageno_',$wrap).text(''+(counter+1)+'/'+gallery.length);
				
				// update active class on slide link
				if(config.links){
					$('.active_',$wrap).removeClass('active_');
					$('.slidelinks_ div',$wrap).eq(counter).addClass('active_');
				};
			};
			
			// is the rotator currently in 'play' mode
			function isPlaying(){
				return $('.play_',$wrap).hasClass('paused_') ? false : true;
			};
			
			// start slide rotation on specified interval
			function play(src) {
				if(!isBusy()){
					counter++;
					transitionTo(gallery,counter);
					if(src=='hover' || !isPlaying()) {
						timer = setInterval(function(){ 
								play(); 
								/*console.log('setInterval loop',myjsocount);*/ 
							},config.speed
						);
					}
					if(!isPlaying()){
						$('.play_',$wrap).html(config.controlText.pause).removeClass('paused_');
					}
				};
			};
			
			// stop slide rotation
			function pause(src) {
				clearInterval(timer);
				if(!src || src=='playBtn') $('.play_',$wrap).html(config.controlText.play).addClass('paused_');
				if(config.animatePause && src=='playBtn'){
					$('<div class="pausetext_">'+config.controlText.pause+'</div>').css({ fontSize:'62%', textAlign:'center', position:'absolute', top:'40%', lineHeight:'100%', width:'100%' }).appendTo($wrap).addClass('pauseText_').animate({ fontSize:'600%', top:'30%', opacity:0 }, {duration:500,complete:function(){$(this).remove();}});
				}
			};
			
			// load the next slide
			function next() {
				goToAndPause(counter+1);
			};
		
			// load the previous slide
			function previous() {
				goToAndPause(counter-1);
			};
			
			// is the rotator in mid-transition
			function isBusy() {
				return $cont.children().length>1 ? true : false;
			};
			
			// load a specific slide
			function goToAndPause(index) {
				$cont.children().stop(true,true);
				if((counter != index) || ((counter == index) && isBusy())){
					if(isBusy()) $cont.children().eq(0).remove();
					transitionTo(gallery,index);
					pause();
				};
			};	

			// load images into memory
			function preloadImg() {
				$(gallery).each(function(i){
					$(this).find('img').each(function(i){
						preloadedImg[i] = $('<img>').attr('src',$(this).attr('src'));					
					});
				});
			};
				
			// generate and add play/pause, prev, next controls
			function addControls() {
				$wrap.prepend(
'<div class="controls_">'
	+'<div class="btn_ prev_">'+config.controlText.previous+'</div> '
	+'<div class="btn_ next_">'+config.controlText.next+'</div> '
	+'<div class="btn_ play_">'+config.controlText.pause+'</div> '
	+'<div class="pageno_">'+'1/'+gallery.length+'</div> '
+'</div>');
				$('.controls_ .btn_',$wrap).each(function(){
						if($(this).hasClass('play_')) $(this).click(function(){ isPlaying() ? pause('playBtn') : play(); return false; } );
						if($(this).hasClass('prev_')) $(this).click(function(){ previous(); return false; });
						if($(this).hasClass('next_')) $(this).click(function(){ next(); return false; });
	
				});
			};	

			// generate and add slide links
			function addSlideLinks() {
				var $dots=$('<div class="slidelinks_"></div>');
				$wrap.prepend($dots);
				$.each(gallery, function(i, val) {
					var linktext = ($(this).attr('title')) ? $(this).attr('title') : i+1;
					$('<div class="slidelink_'+i+'_">'+linktext+'</div>')
					  .bind('click', {index:i}, function(e){ goToAndPause(e.data.index); return false; })
						.appendTo($dots);
				});
			};		
	
	
		// end .each
		});
	
		return this;

	// end .jshowoff
	};

// end closure
})(jQuery);




(function($) {

	$.fn.slideIt = function(settings,callback) {
	
		// default global vars
		var config = {
			direction : 'left',
			showHide : 'show',
			changeSpeed : 600
		};
		
		// merge default global variables with custom variables, modifying 'config'
		if (settings) $.extend(config, settings);
		
		this.each(function(i) {	
			$(this).css({left:'auto',right:'auto',top:'auto',bottom:'auto'});
			var measurement = (config.direction == 'left') || (config.direction == 'right') ? $(this).outerWidth() : $(this).outerHeight();
			var startStyle = {};
			startStyle['position'] = $(this).css('position') == 'static' ? 'relative' : $(this).css('position');
			startStyle[config.direction] = (config.showHide == 'show') ? '-'+measurement+'px' : 0;
			var endStyle = {};
			endStyle[config.direction] = config.showHide == 'show' ? 0 : '-'+measurement+'px';
			$(this).css(startStyle).animate(endStyle,config.changeSpeed,callback);
		// end .each
		});
	
		return this;
		
	// end .slideIt
	};

// end closure
})(jQuery);
