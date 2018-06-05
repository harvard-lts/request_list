(function(exports) {

    function RequestList(item_limit) {
	this.item_limit = item_limit;
	this.setUpList();
    };

    RequestList.prototype.cookie = function(cookie_name, value) {
	if (!value) {
	    return $.cookie('as_pui_request_list_' + cookie_name, { path: '/' });
	}

	var args = Array.prototype.slice.call(arguments, 0);
	args[0] = 'as_pui_request_list_' + args[0];
	args.push({ path: '/' });
	return $.cookie.apply(this, args);
    };

    RequestList.prototype.getList = function() {
	return JSON.parse(this.cookie("list_contents"));
    };

    RequestList.prototype.setList = function(list) {
	this.cookie("list_contents", JSON.stringify(list));
    };

    RequestList.prototype.isInList = function(uri) {
	var list = this.getList();
	return !($.inArray(uri, list) == -1);
    };

    RequestList.prototype.updateButtonState = function() {
	var rl = this;
	$(".request_list_action_button").each(function(ix) {
	    var button = $(this);
	    if (rl.isInList(button.data("uri"))) {
		var i = button.find("i." + button.data("add-icon"));
		if (i) {
		    i.removeClass(button.data("add-icon"));
		    i.addClass(button.data("remove-icon"));
		    button.attr("title", button.data("remove-label"));
		    button.html(button.html().replace(button.data("add-label"), button.data("remove-label")));
		}
	    } else {
		var i = button.find("i." + button.data("remove-icon"));
		if (i) {
		    i.removeClass(button.data("remove-icon"));
		    i.addClass(button.data("add-icon"));
		    button.attr("title", button.data("add-label"));
		    button.html(button.html().replace(button.data("remove-label"), button.data("add-label")));
		}
	    }
	});
    };

    RequestList.prototype.toggleItemExpand = function(item) {
	var item_form = $(item).children('.rl-item-form')
	if (item_form.is(':visible')) {
	    item_form.slideUp(function() {
	        $(this).parent().find('.rl-expand-item-button').find('i')
		       .removeClass('fa-angle-up').addClass('fa-angle-down');
	    });
	    $(item).css('background', '');
	} else {
	    $(item).css('background', '#f2f2f2');
	    item_form.slideDown(function() {
		var expandButton = $(this).parent().find('.rl-expand-item-button');
	        expandButton.find('i').removeClass('fa-angle-down').addClass('fa-angle-up');
		expandButton.show();
	    });
	}
    };

    RequestList.prototype.originalListOrder = function(reverse) {
	var $list = $('.rl-list');
	var $items = $list.children('.rl-list-item');
	$items.detach();

	this.getList().forEach(function(u) {
	    $list.append($items.filter('div[data-uri=' + CSS.escape(u) + ']'));
	});
    };

    RequestList.prototype._sortList = function(field, reverse) {
	var $list = $('.rl-list');
	var $items = $list.children('.rl-list-item');

	$items.sort(function(a, b) {
		var ia = $(reverse ? b : a).data('sort-' + field).toLowerCase();
		var ib = $(reverse ? a : b).data('sort-' + field).toLowerCase();
		if (ia < ib) { return -1 }
		if (ia > ib) { return 1 }
		return 0;
	    });

	$items.detach().appendTo($list);
    };

    RequestList.prototype.sortList = function(field) {
	this._sortList(field, false);
    };

    RequestList.prototype.reverseSortList = function(field) {
	this._sortList(field, true);
    };

    RequestList.prototype.sortStates = function() {
	return {
	    'fa-sort': 'fa-sort-down', 
	    'fa-sort-down': 'fa-sort-up', 
	    'fa-sort-up': 'fa-sort', 
	};
    };

    RequestList.prototype.sortButtonClick = function(button, field) {
	var icon = $(button).children('i');
	var allButtonIcons = $('.rl-sort-button').children('i');
	var states = this.sortStates();
	var nextState = states[icon.attr('class').match(/(fa-sort[^ ]*)/)[1]];
	for (k in states) { allButtonIcons.removeClass(states[k]); }
	allButtonIcons.addClass('fa-sort');
	icon.removeClass('fa-sort');
	icon.addClass(nextState);

	icon.parent().parent().children('.rl-sort-button').css('background', '');
	icon.parent().parent().children('.rl-sort-button').each(function(ix, but) { $(but).attr('title', $(but).attr('data-title')) });
	$('.rl-sort-button').css('font-weight', 'normal');
	$('.rl-display').css('background', '');
	if (icon.hasClass('fa-sort')) {
	    this.originalListOrder();
	} else if (icon.hasClass('fa-sort-down')) {
	    this.sortList(field);
	    icon.parent().css('background', '#f2f2f2');
	    $(button).attr('title', 'Sorted A-Z')
	    $(button).css('font-weight', 'bold');
            $('.rl-display-' + $(button).data('key')).css('background', '#f2f2f2');
	} else {
	    this.reverseSortList(field);
	    icon.parent().css('background', '#f2f2f2');
	    $(button).attr('title', 'Sorted Z-A')
	    $(button).css('font-weight', 'bold');
            $('.rl-display-' + $(button).data('key')).css('background', '#f2f2f2');
	}
    };

    RequestList.prototype._setAllItems = function(value) {
	$('.rl-item-check').prop('checked', value);
    };

    RequestList.prototype.selectAllButtonClick = function() {
	this._setAllItems(true);
    };

    RequestList.prototype.selectNoneButtonClick = function() {
	this._setAllItems(false);
    };

    RequestList.prototype.submitButtonClick = function(handlerId) {
	var self = this;
	var startListLength = self.getList().length

        setTimeout(function() {
            $('#rl-handler-' + handlerId).find('.rl-list').children('.rl-list-item').each(function(ix, rli) {
                self.removeFromList($(rli).data('uri'), true);
                self.removeFromForm($(rli));
            })
            self.setUpList();

	    var itemsSent = startListLength - self.getList().length;

	    if (itemsSent > 0) {
	        // seems we need to cover 2 cases here - whether the submit button's target tab is open yet ... sigh
	        setTimeout(function() { location.replace(location.href + '?sent=' + itemsSent); }, 1000);
	        location.replace(location.href + '?sent=' + itemsSent);
	    }
	}, 100);

	return true;
    };

    RequestList.prototype.removeAll = function() {
	this.setList([]);
	location.reload(true);
    };

    RequestList.prototype.removeFromListButtonClick = function(button) {
	this.removeFromList($(button).data('uri'));
	this.removeFromForm($(button).parents('.rl-list-item'));
    };

    RequestList.prototype.removeFromForm = function(item) {
	item.slideUp('normal', function() {$(this).remove()});
    };

    RequestList.prototype.showListCount = function(flash) {
	var items = this.getList().length;
	var a = $("a[href='/plugin/request_list']").first();
	a.html(a.html().replace(/ \(\d+\)/, " (" + items + ")"));
	if (flash) {
	    a.parent().fadeOut(100).fadeIn(100).fadeOut(100).fadeIn(100);
	}
	if (items >= this.item_limit) {
	    a.parent().addClass('request-list-full');
	} else {
	    a.parent().removeClass('request-list-full');
	}
    };

    RequestList.prototype.addToList = function(uri) {
	var list = this.getList();
	if (list.length >= this.item_limit) {
	    alert("Your list is full. Please go to 'My List' and remove items or submit your requests to make room for more.");
	    return;
	}
	if (this.isInList(uri)) {
	    return false;
	} else {
	    list.push(uri);
	    this.setList(list);
	    this.showListCount(true);
	    return true;
	}
    };

    RequestList.prototype.removeFromList = function(uri, silent) {
	var list = this.getList();
	if (this.isInList(uri)) {
	    list.splice($.inArray(uri, list), 1);
	    this.setList(list);
	    this.showListCount(!silent);
            this.showRemoveAllButton();
	    if (list.length == 0) {
		location.reload(true);
	    }
	    return true;
	} else {
	    return false;
	}
    };

    RequestList.prototype.toggleListItem = function(uri) {
	if (this.isInList(uri)) {
	    this.removeFromList(uri);
	} else {
	    this.addToList(uri);
	}
	this.updateButtonState();
    };

    RequestList.prototype.showRemoveAllButton = function() {
	if (this.getList().length > 1) {
            $('.rl-remove-all').show();
        } else {
            $('.rl-remove-all').hide();
	}
    };

    RequestList.prototype.setUpList = function() {
	if (!this.cookie("list_contents")) {
	    this.setList([]);
	}
	    
	this.updateButtonState();
	this.showListCount();
        this.showRemoveAllButton();
    };

    exports.RequestList = RequestList;

}(window));

// Make sure the list is set up when arriving from a back button click
window.onpageshow = function(event) {
  if (typeof window.request_list !== 'undefined') {
      window.request_list.setUpList();
  }
}

$(function() {
    $('.rl-list-item').hover(
        function() {
	    $(this).find('.rl-expand-item-button').show();
	    return true;
	},
	function() {
	    var itemForm = $(this).find('.rl-item-form');
	    if (itemForm.is(':hidden') || itemForm.is(':animated')) {
		$(this).find('.rl-expand-item-button').hide();
	    }
            return true;
	}
)});
