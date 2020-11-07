/**
 * @license Copyright (c) 2012 CommonTown Pte Ltd. All rights reserved. 
 */
// 2012-09-15 joel: attn and litebox  
(function($){

var detectbrowser=function() {
  var matched, browser;
  var uaMatch = function( ua ) {
    ua = ua.toLowerCase();

    var match = /(chrome)[ \/]([\w.]+)/.exec( ua ) ||
      /(webkit)[ \/]([\w.]+)/.exec( ua ) ||
      /(opera)(?:.*version|)[ \/]([\w.]+)/.exec( ua ) ||
      /(msie) ([\w.]+)/.exec( ua ) ||
      ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec( ua ) ||
      [];

    return {
browser: match[ 1 ] || "",
           version: match[ 2 ] || "0"
    };
  };

  matched = uaMatch( navigator.userAgent );
  browser = {};

  if ( matched.browser ) {
    browser[ matched.browser ] = true;
    browser.version = matched.version;
  }

  // Chrome is Webkit, but Webkit is also Safari.
  if ( browser.chrome ) {
    browser.webkit = true;
  } else if ( browser.webkit ) {
    browser.safari = true;
  }

  jQuery.browser = browser;
};
if (!$.browser) detectbrowser();


// ----- ATTN / POINTER -----
var $attn, $pointer;
var msg_tmo_id; // timeout obj id
$.extend({
  attn: function(html,opt) {
    opt = $.extend({
      autoclose: 2000, //  close after msec
      duration: 500, //  fadein in msec
      close: false, // show close button
      left: 'auto', //  x offset (auto=center)
      top: 150, //  y offset 
      width: 400,
      height: 'auto',
      bottom:'auto',
      after_open: null,
      point_at: null // XXX
    }, opt || {});

    if (typeof opt.autoclose!='number') opt.close=true;

    if (msg_tmo_id) clearTimeout(msg_tmo_id);
    if (!$attn) {
      $('body').append($attn=$('<div class="ctjq_attn"><div class="content_"></div><div class="close_">Close</div></div>'));
      $attn.hover(function(ev) {
	if (ev.type=='mouseenter') {
	  if (msg_tmo_id && opt.close) {
	    if (opt.point_at) {
	      $attn.pointer(opt.point_at);
	      $attn.stop().fadeTo(0,.8);
	    }
	    clearTimeout(msg_tmo_id);
	  }
	}
	else if (opt.point_at) opt.point_at.pointer();
      }); 
      $('.close_',$attn).css('opacity',0.7)
        .hover(function(ev){ $(this).css('opacity',(ev.type=='mouseenter')?1:0.7); })
	.click(function(){ $attn.fadeOut(opt.duration); });
    } 

    var css;
    css={height:opt.height,left:'auto',top:'auto',bottom:'auto',right:'auto'};
    css.bottom=opt.bottom;
    css.top=opt.top;
    css.width=opt.width;

    $attn.css('width',css.width);
    if (opt.right) css.right=opt.right;
    else css.left=(opt.left=='auto')?($(window).width()-$attn.width())/2:opt.left;

    if (html) {
      $('.content_',$attn).html(html);
      $attn.css(css).fadeIn(opt.duration,opt.after_open);
      $('.close_',$attn).toggle(opt.close?true:false);
      if (opt.autoclose) msg_tmo_id=setTimeout(function(){ $attn.fadeOut(1000); }, parseInt(opt.autoclose)); 
    }
    else $attn.fadeOut(opt.duration);
    return this;
  },

  pointer: function($dest,opt) {
    var opos,owidth,oheight,npos,nwidth,nheight;
    if (!$pointer) {
      $pointer=$('<div class="ctjq_pointer"></div>');
      $('body').append($pointer);
    }

    if (!$dest||!$dest.length) { $pointer.hide(); return; }

    opos=this.offset();
    owidth=this.outerWidth();
    oheight=this.outerHeight();
    nwidth=$dest.outerWidth()+13;
    nheight=$dest.outerHeight()+13;
    npos=$dest.offset();

    $pointer.css({top:opos.top,left:opos.left,width:owidth,height:oheight}).show();

    $pointer.stop().animate({
	width:nwidth,
	height:nheight,
	top: npos.top-11,
	left: npos.left-11
      },
      {
	duration:Math.round((Math.abs(opos.left-npos.left)+Math.abs(opos.top-npos.top))/1.2),
	easing:'easeInOutExpo',
	complete: function() {
	  if (opt&&typeof(opt.callback)=='function') opt.callback.call(this);
	}
      }
    );
    return this;
  }
});

// ----- LITEBOX -----
var $lb_screen, $lb_dialog, $lb_loading;
var lb_closefn;
var lb_placefn;
var lb_returnValue;
var lb_args; // need this coz arrows click closure is the init closure
var lb_compute_size=function(args) {
  args.winw=$(window).width(), args.winh=$(window).height();
  if (args.width) args.objw=args.width;
  if (args.height) args.objh=args.height;
  if (args.maximize || args.winw<args.objw+80) args.objw=args.winw-80;
  if (args.maximize || args.winh<args.objh+80) args.objh=args.winh-80;
  if (args.proportional) {
    var wratio=args.objw/args.width;
    var hratio=args.objh/args.height;
    if (Math.abs(wratio-hratio)>.01) {
      if (wratio>hratio) args.objw=args.width*hratio;
      else args.objh=args.height*wratio;
    }
  }
};
var lb_frames_reconfig=function(assoc){
  if (window.frameElement) {
    var w=window;
    var dv=(document.all?'parentWindow':'defaultView') ;
    while(w&&w.frameElement&&w.frameElement.ownerDocument) {
      w=w.frameElement.ownerDocument[dv];
      $('frameset',w.document).each(function(i){
	var $cur=$(this);
	var cols,rows;
	if (assoc&&assoc[this.id]) {
	  if (cols=assoc[this.id].cols) $cur.data('rl_cols',$cur.attr('cols')).attr('cols',cols);
	  if (rows=assoc[this.id].rows) $cur.data('rl_rows',$cur.attr('rows')).attr('rows',rows);
	}
	else {
	  //revert
	  if (cols=$cur.data('rl_cols')) $cur.attr('cols',cols);
	  if (rows=$cur.data('rl_rows')) $cur.attr('rows',rows);
	} 
      });
    }
  }
};

$.extend({
  litebox:function(args) {
    //  url: 
    // Optional args
    //  type: image
    //  title: string, width: number, height: number
    //  X easy_close: true to close when click outside litebox

    if (typeof args=='string') {
      if (args=='close'&&lb_closefn) lb_closefn();
      return;
    }
    if (typeof args.close=='undefined') args.close=true;
    if (args.query) {
      var oldok=args.ok;
      args.title=args.query; 
      if (typeof args.cancel=='undefined') args.cancel=true; 
      if (typeof args.close=='undefined') args.close=false;
      args.element='<input size="30" class="text_" value=""/>';
      args.ok=function(dom){
        if (typeof oldok=='function') oldok(dom.value);
      }
    }

    if (args.url && !args.width) args.maximize=true;

    $('#ive_helpline').fadeOut(); // hide helpline

    // init dom and callbacks once
    if (!$lb_screen) {
      $lb_screen=$('<div class="ctjq_litebox_screen"><div class="loading_"></div></div>');
      $lb_loading=$('.loading_',$lb_screen);
      $('body').append($lb_screen);

      $lb_dialog=$(
'<div class="ctjq_litebox_dialog">'
+'<div class="move_cover_"></div>'
+'<div class="btn_close_"></div>'
+'<div class="loading_"></div>'
+'<div class="title_"></div>'
+'<div class="content_"></div>'
+'<div class="caption_"></div>'
+'<div class="count_"></div>'
+'<div class="arrow_ prev_"></div>'
+'<div class="arrow_ next_"></div>'
+'<div class="control_">'
  +'<input type="button" class="btn_cancel_" value="Cancel"/>'
  +'<input type="button" class="btn_ok_" value="OK"/>'
+'</div>'
+'</div>'
);
      $('body').append($lb_dialog);

      lb_closefn=function(status){
	$('.inner_',$lb_dialog).unbind('load.litebox');
        $lb_dialog.stop().slideUp(200);
	if (status=='success'&&lb_args.success&&(typeof lb_args.success=='function')) lb_args.success.call(this,lb_returnValue);

	$lb_screen.stop().animate({opacity:0},300,null,function(){
	  $lb_screen.hide();
	  // old dialog code set the returnValue to expect reload of page
	  if ((lb_returnValue&&lb_returnValue.refresh) || window.returnValue=='full_refresh') document.location.reload();
	});
	if (!lb_args.background_scroll) 
	  $('body').css('overflow','visible'); // reactivate scroll event

	// 2013-08-16 joel: revert frames config 
	if (window.frameElement&&lb_args.frames_reconfig) lb_frames_reconfig();
      };

      //$('.btn_close_',$lb_dialog).click(lb_closefn);

      $('.btn_ok_,.btn_cancel_,.btn_close_',$lb_dialog).click(function(ev){
        var $data=$('.content_ > *',$lb_dialog).detach();
	var btnarg=this.className.replace(/.*btn_(\w+)_.*/,'$1');
        if (lb_args[btnarg] && typeof lb_args[btnarg]=='function') lb_args[btnarg]($data.get(0));
	lb_closefn();
      });

      $('.arrow_',$lb_dialog).hover(function(ev){ $(this).toggleClass('armed_'); });
      $('.next_',$lb_dialog).click(function(ev){ 
        if (typeof lb_args.next=='function') lb_args.next.call(this,ev);
      });
      $('.prev_',$lb_dialog).click(function(ev){ 
        if (typeof lb_args.prev=='function') lb_args.prev.call(this,ev);
      });

      // 2012-07-26 joel: DIALOG DND
      $lb_dialog
	.mousedown(function(ev){
	  var tgt=ev.srcElement||ev.target;
	  // right click only and on dialog frame and title
	  if (ev.button!=0||(tgt.className.indexOf('ctjq_litebox_dialog')<0&&tgt.className.indexOf('title_')<0)) return; 

	  var overflow=$(tgt).css('overflow');
	  if ('|INPUT|TEXTAREA|SELECT|OPTION|'.indexOf('|'+tgt.tagName+'|')>=0) return;
	  if (overflow=='scroll'||overflow=='auto') return; // click on scrollbar will cause sticking problem

	  if (tgt.className.indexOf('title_')>=0) tgt=$(tgt).closest('.ctjq_litebox_dialog').get(0);

	  var $content=$('.content_',tgt);
	  $('.move_cover_',tgt).height($content.height()).width($content.width()).show();

	  var $obj=$(this);
	  var pos={top:parseInt($obj.css('top')),left:parseInt($obj.css('left'))};
	  // o: dialog original pos, d: mouse down pos
	  var ox=pos.left, oy=pos.top;
	  var dx=ev.pageX, dy=ev.pageY;

	  var
	    dmove=function(ev){
	      // ev.which indicates the mouse button which is pressed. not used. now using the overflow detection above
	      var newpos;
	      $obj.css(newpos={left:ox+ev.pageX-dx,top:oy+ev.pageY-dy});
	      ev.stopImmediatePropagation();
	      return false;
	    }
	    ,dstop=function(ev){
	      $('.move_cover_',tgt).hide();
	      $(document).unbind('.ive_dialog');
	      return false;
	    };
	  
	  $(document).bind({'mousemove.ive_dialog':dmove,'mouseup.ive_dialog':dstop});
	  ev.stopImmediatePropagation();
	  return false;
	})
	// show the caption and count only when hover
	/* 
	.hover(function(ev){ 
	  if (ev.type=='mouseenter') $('.caption_,.count_').fadeIn(300);
	  else $('.caption_,.count_').fadeOut(300);
	})
	*/
	;
    }

    // per call starts here
    lb_args=args;
    if (typeof lb_args.screen_opacity=='undefined') lb_args.screen_opacity=0.4;
    if (typeof lb_args.background_scroll=='undefined') lb_args.background_scroll=false;
    if (typeof lb_args.screen=='undefined') lb_args.screen='dark';

    // 2013-08-16 joel: frames reconfig
    if (window.frameElement&&lb_args.frames_reconfig) lb_frames_reconfig(lb_args.frames_reconfig);

    lb_compute_size(lb_args); // compute size

    if ($lb_loading) $lb_loading.css({top:lb_args.winh/3,left:(lb_args.winw-$lb_loading.width())/2}).show();

    var serialcall=false; // called again while lb is active

    // visibility
    if (lb_args.screen=='dark' && !lb_args.background_scroll) 
      $('body').css('overflow','hidden'); // block scroll event

    if (lb_args.screen!='none') {
      if ($lb_dialog.is(':visible')) 
      //if ($lb_screen.is(':visible')) 
      { 
	serialcall=true;
	$('.content_',$lb_dialog).slideUp(100); 
//        $lb_dialog.animate({top:50},200); // JUMP ANIM
      }
      else $lb_screen.css('opacity',0).show().stop().animate({opacity:lb_args.screen_opacity},200); // show if not visible
    }

    if (lb_args.title) $('.title_',$lb_dialog).html(lb_args.title).show();
    else $('.title_',$lb_dialog).hide();
    $('.loading_',$lb_dialog).show();

    $('.next_,.prev_',$lb_dialog).hide();

    $('.caption_',$lb_dialog).html(lb_args.caption||'').hide();
    $('.count_',$lb_dialog).html(lb_args.count||'').hide();

    $('.control_',$lb_dialog).toggle(lb_args.ok?true:false);
//    $('.btn_ok_',$lb_dialog).toggle(lb_args.ok?true:false);
    $('.btn_close_',$lb_dialog).toggle(lb_args.close?true:false);

    // logic
    var contenthtml; // can be dom or html string
    var css={};


    // element: dom
    if (lb_args.element) {
      lb_args.type='dom';
      contenthtml=$(lb_args.element).clone();
    }

    // url: image or iframe
    var src=(typeof lb_args.url=='string'?lb_args.url:'');
    if (src || lb_args.type=='iframe') {
      if (!lb_args.type) lb_args.type='iframe'; // not set => use iframe
      if (lb_args.type=='iframe') {
	var sep=(src.indexOf('?')>=0)?'&':'?';
	if (src&&src.indexOf('litebox=')<0) src+=sep+'litebox=1';
      }

      // contenthtml
      if (true||src) {
	if (lb_args.type=='image') {
	  contenthtml='<img class="inner_" src="'+src+'" style="display:none"/>';
	}
	else if (lb_args.type=='iframe') {
	  contenthtml='<iframe name="litebox_iframe" class="inner_" width="'+lb_args.objw+'" height="'+lb_args.objh+'" src="'+src+'" frameborder="0"></iframe>';
	}
      }
    }

    lb_placefn=function(){
      var cb=function(){ 
        $('input:text,textarea',$lb_dialog).filter(':visible:first').focus();
        $('.inner_',$lb_dialog).slideDown(300);
	if (lb_args.next) $('.next_',$lb_dialog).slideDown(200);
	if (lb_args.prev) $('.prev_',$lb_dialog).slideDown(200);
	if (lb_args.caption) $('.caption_',$lb_dialog).css({bottom:200,opacity:0}).show().animate({opacity:.5,bottom:0},{duration:400});
	if (lb_args.count) $('.count_',$lb_dialog).css({bottom:50,opacity:0}).show().animate({opacity:.3,bottom:0},{duration:300});
      };
      // query box need to grab w/h here
      if (typeof lb_args.objw=='undefined') lb_args.objw=$lb_dialog.width();
      if (typeof lb_args.objh=='undefined') lb_args.objh=$lb_dialog.height();

      var left,top;
      if (lb_args.place_top) {
        var hdiff=$lb_dialog.outerHeight()-$lb_dialog.height();
        if (lb_args.place_top<0) 
	  top=(lb_args.winh-lb_args.objh)-hdiff+lb_args.place_top;
	else
	  top=lb_args.place_top;
      }
      else {
	// default: center
	top=(lb_args.winh-lb_args.objh)/2;
      }
      if (lb_args.left)  left=lb_args.left;
      else left=(lb_args.winw-lb_args.objw)/2;
      $lb_dialog.animate({left:left,top:top}, { duration:100 });
      if (serialcall) { 
	$lb_dialog.show(); // 2013-06-19 joel: show again for sure, somehow catalog generates two click events (?!)
        $('.content_',$lb_dialog).slideDown(300,cb); // fadein content_
      }
      else $lb_dialog.fadeIn(300,cb); // simple fadein
//      console.log('win',lb_args.winw,lb_args.winh);
    };

    var lb_readyfn=function(ev){
      if ($lb_loading) $lb_loading.hide(); // this is the one on the screen
      $('.loading_',$lb_dialog).hide();  // this is the one in the litebox
      if (this.tagName=='IMG') {
	var newh,neww;
        var natw=this.width||this.naturalWidth,nath=this.height||this.naturalHeight;
	if (!natw) {
	  var newimg=new Image();
	  newimg.src=this.src;
	  natw=newimg.width;
	  nath=newimg.height;
	}
        newh=nath;
        neww=natw;
	// scale proportionally
	if (natw>lb_args.objw || nath>lb_args.objh) {
	  if (natw/lb_args.objw>nath/lb_args.objh) {
	    $(this).width(lb_args.objw);
	    newh=nath/(natw/lb_args.objw);
	    neww=lb_args.objw;
	  }
	  else {
	    $(this).height(lb_args.objh);
	    newh=lb_args.objh;
	    neww=natw/(nath/lb_args.objh);
	  }
	}
	// arrows
	$('.arrow_',$lb_dialog).height(newh);
	lb_args.objw=neww;
	lb_args.objh=newh;
      }

      if (typeof lb_args.ready=='function') lb_args.ready.call(this.contentDocument);
      lb_placefn();
      $(this).unbind('load.litebox'); // 2012-11-13  joel: drop it. Call it once only
    };

    if (contenthtml) {
      $('.content_',$lb_dialog).html(contenthtml);

      // ONLOAD callback
      if (typeof contenthtml=='string') $('.inner_',$lb_dialog).bind('load.litebox',lb_readyfn);
      else {
        // must be dom, show content and call readyfn
	$('.content_ > *',$lb_dialog).css('visibility','visible').show();
        lb_readyfn();
      }
    }
    // the form action cannot take obj as target, must be the iframe name
    if (lb_args.type=='iframe') return 'litebox_iframe';
    //if (lb_args.type=='iframe') return $('iframe:first',$lb_dialog).get(0); 
  }

  // place data for the 'success' callback to retrieve
  // if data.refresh==true, parent will refresh
  ,litebox_return:function(data,callparent) { 
    // this is usually called from within the litebox which need to call the container window's litebox_return
    if (typeof callparent=='undefined') window.parent.$.litebox_return(data,false);
    else {
      lb_returnValue=data; 
      lb_closefn('success');
    }
  }

  // resize the litebox, call parent's litebox unless callparent==false
  ,litebox_resize:function(args,callparent) { 
    if (typeof callparent=='undefined') return window.parent.$.litebox_resize(args,false);
    else {
      if (typeof lb_args!='object') return;
      if (typeof args.maximize=='undefined') args.maximize=false;
      lb_args.width=args.width;
      lb_args.height=args.height;
      lb_args.proportional=args.proportional;
      lb_args.maximize=args.maximize;
      lb_compute_size(lb_args);
      $('.inner_',$lb_dialog).animate({width:lb_args.objw,height:lb_args.objh});
      lb_placefn();
      return {width: lb_args.objw, height:lb_args.objh};
    }
  }
});


// SEQTHESE
var $seqtrash,$seqedit,$seqadd,$seqbtns;
$.fn.seqthese=function(sel,opt){
  var $ctr=this; // container
  var $list=$(sel,$ctr);
  if (sel=='stop') {
    $seqbtns.hide();
    $seqadd.hide();
    return $ctr.off('.seqthese');
    //return $list.unbind('.seqthese');
  }

  opt = $.extend({
    edit:false
    ,trash:false
  }, opt || {});

  // init once
  if (!$seqbtns) {
    var style='position:absolute; display:none; width:16px; height:16px; z-index:100; top:4px; cursor:pointer; ';
    $seqedit=$('<div id="seqthese_edit" class="seqthese" style="background:url(/rs/action/edit.png) no-repeat; '+style+'right:0"></div>');
    $seqtrash=$('<div id="seqthese_trash" class="seqthese" style="background:url(/rs/action/delete.png) no-repeat; '+style+'right:18px"></div>');
    $seqadd=$('<div id="seqthese_add" class="seqthese" style="background:url(/rs/action/add.png) no-repeat; '+style+'left:0"></div>');
    $seqbtns=$([$seqtrash.get(0),$seqedit.get(0)]);
    $('body').append($seqbtns).append($seqadd);

    $seqbtns.mousedown(function(ev){
      ev.stopImmediatePropagation();
    });

    $seqedit.click(function(ev){
      var $target=$seqedit.parent();
      var urltail=$target.data('seqthese').urltail;
      var lbopt={ url:opt.edit+urltail, screen_opacity:0.2, background_scroll:true , left:30};
      $('body').append($seqbtns); // move buttons out of obj
      if (typeof opt.onedit=='function') opt.onedit.call($target.get(0));
      if (typeof opt.oneditdone=='function') lbopt.close=function(){ opt.oneditdone.call($target.get(0)); }
      $.litebox(lbopt);
    });
    $seqtrash.click(function(ev){
      var $target=$seqedit.parent();
      var urltail=$target.data('seqthese').urltail;
      $('body').append($seqbtns); // move buttons out of obj
      if (confirm('Delete this channel?')) { 
	$target.remove();
	$.ajax({ url:opt.trash+urltail});
      }
    });

    $seqadd.click(function(){
      var lbopt={ url:opt.add, screen_opacity:0.2, background_scroll:true , left:30};
      if (typeof opt.onadddone=='function') lbopt.close=function(){ opt.onadddone.call(); }
      $.litebox(lbopt);
    });
  }

  var $grabbed=false;
  // add button
  if ($list.lengt) $list.last().after($seqadd);
  else $ctr.append($seqadd);
  $seqadd.css({position:'relative',margin:'auto'}).show();

//  $list.css('position','relative');
  $ctr
    .on('mousedown.seqthese',sel,function(ev){
      if ($grabbed) $grabbed.removeClass('grabbed_');
      $grabbed=$(this);
      $grabbed.addClass('grabbed_');

      $(document).bind('mouseup.seqthese',function(ev){
	$grabbed.removeClass('grabbed_');
	$grabbed=false;
	$(document).unbind('.seqthese');
	ev.stopImmediatePropagation();
      });
      ev.stopImmediatePropagation();
      return false;
    })
    .on('mouseenter.seqthese',sel,function(ev){
      if ($grabbed) return;
      $seqbtns.show();
      $(this).css('position','relative').append($seqtrash).append($seqedit); // only trash and edit button
    })
    .on('mouseleave.seqthese',sel,function(ev){
      if ($grabbed&&($grabbed.get(0)!=this)) {
	var $target=$(this);
	var h=$target.height();
        if (ev.offsetY/h>0.5) {
	  $target.after($grabbed);
	}
	else {
	  $target.before($grabbed);
	}
      }
    })
  ;

};

$.fn.linkto=function(opt){
  if (opt.newwin) {
    window.open(opt.url);
  }
  else {
    document.location=opt.url;
  }
};

// ----- MISC
$.extend({
  getcookie:function(name){
    var start = document.cookie.indexOf(name+"=");
    var len = start+name.length+1;
    if ((!start) && (name != document.cookie.substring(0,name.length))) return null;
    if (start == -1) return "";
    var end = document.cookie.indexOf(";",len);
    if (end == -1) end = document.cookie.length;
    return unescape(document.cookie.substring(len,end));
  }

  ,setcookie:function(c_name,value,exdays) {
    var exdate=new Date();
    if (!exdays) exdays=3;
    exdate.setDate(exdate.getDate() + exdays);
    var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
    document.cookie=c_name + "=" + c_value;
  }

  ,getCSS:function(fn){
    var fstem=fn.match(/([\w\-]*)\.(\w*)$/)[1];
    var id='getcss-'+fstem;
    var $old=$('link.getcss#'+id);
    if ($old.length) return $old.get(0);

    var scrtag=document.createElement('link');
    scrtag.rel='stylesheet';
    scrtag.type = 'text/css';
    scrtag.className = 'getcss';
    scrtag.href = fn;
    scrtag.id = id;

    var head=document.head||document.getElementsByTagName('head')[0];
    head.appendChild(scrtag);
    return scrtag;
  }
});

})(jQuery);

