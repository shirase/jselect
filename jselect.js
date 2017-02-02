(function($) {
    $.fn.jselect = function(option) {
        var settings = {
            autocomplete:false,
            autocomplete_min:3,
            autocomplete_timeout:300,
            displayTag:'input'
        };

        $.extend(settings, option);

        return this.each(function() {
            var element = $(this);
            var fakeselect = element;
            var disabled = false;

            var orgType = element[0].tagName.toLowerCase();

            if(orgType!='select' && orgType!='input') {
                return;
            }

            if(element.prop('disabled')) disabled = true;

            var multiselect = (element.prop('multiple') ? true : false);

            var fn_key = function(event) {
                if(disabled) return;

                switch(event.which) {
                    case 27: // ESCAPE
                        event.preventDefault();
                        widget.close();
                        break;
                    case 13: // ENTER
                        event.preventDefault();
                        options.find('.option.active.disabled').removeClass('active');
                        var active = options.find('.option.active').first();
                        if(active.length) {
                            active.trigger('click');
                        }
                        //if(input) input.blur();
                        break;
                    case 38: // UP
                        event.preventDefault();
                        options.find('.option.active.disabled').removeClass('active');
                        var active = options.find('.option.active');
                        if(active.length>1) {
                            active = active.removeClass('active').first();
                        }
                        if(active.length) {
                            active.removeClass('active');
                            active.prevAll('div:not(.disabled):visible').first().addClass('active');
                        } else {
                            options.find('.option:not(.disabled):visible:last').addClass('active');
                        }
                        break;
                    case 40: // DOWN
                        event.preventDefault();
                        options.find('.option.active.disabled').removeClass('active');
                        var active = options.find('.option.active');
                        if(active.length>1) {
                            active = active.removeClass('active').first();
                        }
                        if(active.length) {
                            active.removeClass('active');
                            active.nextAll('div:not(.disabled):visible').first().addClass('active');
                        } else {
                            options.find('.option:not(.disabled):visible:first').addClass('active');
                        }
                        break;
                }
            }

            var hider_click = function(event) {
                var e = $(event.target).closest('.jselect');
                if(e.length && e[0]==jselect[0]) return;
                widget.close();
            };

            var widget = {
                reset: function() {
                    makeLabel();
                },

                set: function(value) {
                    if(multiselect) {
                        fakeselect.find('option').prop('selected', false);
                        jselect.find('.option:not(.all)').each(function() {
                            var $option = $(this);
                            var v = $(this).data('option').attr('value');
                            if(value && $.inArray(v, value)>-1 && !$(this).is('.disabled')) {
                                $option.find('input').prop('checked', true);
                                $option.data('option').prop('selected', true);
                            }
                        });
                    } else {
                        fakeselect.find('option').prop('selected', false);
                        var options = jselect.find('.option');
                        options.each(function() {
                            var v = $(this).data('option').attr('value');
                            if(value && value==v && !$(this).is('.disabled')) {
                                $(this).data('option').prop('selected', true);
                            }
                        });
                    }

                    makeLabel();
                },

                enable: function(vals, select) {
                    var options = jselect.find('.option:not(.all)');

                    if (select != undefined) {
                        fakeselect.find('option').prop('selected', false);
                    }

                    options.addClass('disabled');

                    options.each(function() {
                        var val = $(this).data('option').attr('value');
                        if(vals[val]!==undefined || !val) {
                            $(this).removeClass('disabled');
                        }
                    });

                    if (select != undefined) {
                        this.set(select);
                    }
                },

                load: function(data, select) {
                    jselect.find('.option:not(.all)').remove();
                    fakeselect.find('option').remove();

                    for(var key in data) {
                        var val = data[key];
                        var option = $('<option></option>').attr('value', key).html(val);
                        fakeselect.append(option);
                    }

                    fakeselect.find('option').each(function() {
                        var option = $(this);
                        var opt = $('<div class="option" />');
                        option.data('$', opt);
                        opt.data('value', option.attr('value')).data('option', option).html(option.html()).appendTo(options);
                        if(multiselect && option.html()) {
                            opt.prepend($('<input type="checkbox">').prop('checked', option.is(':checked')));
                        }
                    });

                    initEvents();

                    this.set(select);
                },

                open: function() {
                    if(options.is(':visible')) return;

                    options.show();

                    if(label && settings['autocomplete']) {
                        label.hide();
                    }

                    setTimeout(function() {
                        $(document.body).on('click', hider_click);
                        $(window).on('keydown', fn_key);
                    }, 10);
                },

                close: function() {
                    if(options.is(':hidden')) return;

                    $(window).off('keydown', fn_key);
                    $(document.body).off('click', hider_click);

                    if(settings['autocomplete']) {
                        if(lastoption && lastoption.length) {
                            element.val(lastoption.val());
                            if(input) input.val(lastoption.html());
                            if(span) span.html(lastoption.html());
                        }
                        lastoption = null;
                    }

                    if(input) {
                        input.blur();
                    }

                    options.hide();

                    if(label && input) {
                        if(options.is(':hidden') && !input.val()) {
                            label.show();
                        } else {
                            label.hide();
                        }
                    }
                }
            }

            if(element.data('jselect')) return;
            element.data('jselect', widget);

            var autocomplete_cache_query;
            var autocomplete_lastquery;
            var autocomplete_timer;

            function autocomplete(q) {
                if(autocomplete_lastquery==q) return;
                autocomplete_lastquery = q;

                if(label) {
                    if(!q && jselect.find('.jselect-data').is(':hidden')) {
                        label.show();
                    } else {
                        label.hide();
                    }
                }

                if(!q || q.length<settings['autocomplete_min']) {
                    jselect.find('.jselect-data .option').show();
                    return;
                }

                function autocomplete_finded(data, finish) {
                    if(data) {
                        widget.load(data);

                        var i = 0;
                        var key = null;
                        for(var key in data) {
                            i++;
                            if(i>1) {
                                key = null
                                break;
                            }
                        }
                        if(key) {
                            q = data[key];
                        }
                    }
                    if(finish) {
                        autocomplete_cache_query = q;
                    }

                    var re = new RegExp(q, 'i');

                    jselect.find('.jselect-data').find('.option').each(function() {
                        var option = $(this);
                        var text = option.html();
                        if(text.search(re)!=-1) {
                            option.show();
                        } else {
                            option.hide();
                        }
                    });

                    widget.open();

                    /*var one = jselect.find('.jselect-data').show().find('.option:visible');
                    if(one.length == 1) {
                        one.data('option').prop('selected', true);
                        makeLabel(true);
                    }*/
                }

                if(settings['autocomplete'] instanceof Function) {
                    if(autocomplete_cache_query && q.indexOf(autocomplete_cache_query)!==0) {
                        autocomplete_cache_query = null;
                    }

                    if(!autocomplete_cache_query) {
                        var fn = settings['autocomplete'];
                        if(autocomplete_timer) clearTimeout(autocomplete_timer);
                        autocomplete_timer = setTimeout(function() {
                            var data = fn(q, autocomplete_finded);
                            if(data) {
                                autocomplete_finded(data, true);
                            }
                        }, settings['autocomplete_timeout']);
                    }
                } else {
                    autocomplete_finded();
                }
            }

            function makeLabel(force) {
                if(orgType!='select') return;

                if(multiselect) {
                    var title = [];
                    element.find('option:selected').each(function() {
                        var option = $(this);
                        if(option.hasClass('all')) return;
                        if(option.data('$').is('.disabled')) {
                            option.prop('selected', false);
                            return;
                        }
                        var text = option.text();
                        if(text) {
                            title.push(text);
                        }
                    });

                    if(input) input.val(title.join(', '));
                    if(span) span.html(title.join(', '));
                } else {
                    var selected = element.find('option:selected');
                    if(!selected.length || selected.data('$').is('.disabled')) {
                        element.find('option').prop('selected', false);
                        selected = jselect.find('.option:not(.disabled)').first().data('option');
                        if(selected && selected.length) {
                            selected.prop('selected', true);
                        }
                    }
                    if(selected && selected.length) {
                        if(!settings['autocomplete'] || force) {
                            if(input) input.val(selected.text());
                            if(span) span.html(selected.html());
                        }
                    }
                }

                if(label && input) {
                    if(!input.val()) {
                        label.show();
                    } else {
                        label.hide();
                    }
                }
            }

            function initEvents() {
                if(disabled) return;

                if(multiselect) {
                    options.find('.option.all input').change(function() {
                        var all = $(this);

                        options.find('.option:not(.all) input').each(function() {
                            var checkbox = $(this);
                            checkbox.prop('checked', all.is(':checked'));
                            checkbox.closest('.option').data('option').prop('selected', checkbox.is(':checked'));
                        });

                        makeLabel();

                        element.trigger('change');
                    });

                    options.find('.option:not(.all) input').change(function(event) {
                        var checkbox = $(this);

                        if(checkbox.closest('.option').hasClass('disabled')) {
                            event.preventDefault();
                            return;
                        }

                        if(multiselect && !checkbox.is(':checked')) {
                            checkbox.closest('.jselect-data').find('.all input').prop('checked', false);
                        }

                        checkbox.closest('.option').data('option').prop('selected', checkbox.is(':checked'));

                        makeLabel();

                        element.trigger('change');
                    });

                    options.find('.option').click(function(event) {
                        var option = $(this);

                        if(event.target!=option[0] || option.hasClass('disabled')) return;

                        var checkbox = option.find('input');
                        checkbox.prop('checked', !checkbox.is(':checked'));
                        lastoption = null;

                        checkbox.trigger('change');
                    });
                } else {
                    options.find('.option').click(function() {
                        var option = $(this);

                        if(orgType=='input') {
                            input.val(option.text());
                        }

                        option.data('option').prop('selected', true);
                        lastoption = null;
                        makeLabel(true);

                        element.trigger('change');

                        widget.close();
                    });
                }
            }

            if(orgType=='input') {
                fakeselect = $('<select />').css('display', 'none');
            }

            var input;
            var span;
            var inputCnt;
            var jselect;

            if(orgType=='select') {
                jselect = $('<div class="jselect" />');

                inputCnt = $('<div class="jselect-ipt" />');

                if(settings['displayTag']=='input') {
                    input = $('<input type="text" />');
                }
                if(settings['displayTag']=='span') {
                    span = $('<span />');
                }

                var button = $('<button type="button" tabindex="-1" />').css({'cursor':'pointer'});
                if(input) inputCnt.append(input);
                if(span) inputCnt.append(span);
                inputCnt.append(button);
                inputCnt.appendTo(jselect);
            } else
            if(orgType=='input') {
                input = element;
                input.attr('autocomplete', 'off');
                inputCnt = input.wrap('<div class="jselect-ipt" />').parent();
                jselect = inputCnt.wrap('<div class="jselect" />').parent();
            }

            widget.$ = jselect;

            var width = element.outerWidth();

            var placeholder = element.attr('placeholder');
            var label;
            if(placeholder && input) {
                label = $('<label tabindex="-1" />').hide().html(placeholder);
                inputCnt.append(label);
            }

            if(orgType=='select') {
                element.hide();
                element.after(jselect);
            }

            if(label) {
                if(button) {
                    if(width < label.outerWidth() + button.outerWidth()) {
                        label.outerWidth(width - button.outerWidth());
                    }
                } else {
                    if(width < label.outerWidth()) {
                        label.outerWidth(width);
                    }
                }
            }

            jselect.css({'position':'relative', 'width':width});
            jselect.data('select', fakeselect);

            if(element.css('margin')) {
                jselect.css('margin', element.css('margin'));
            }

            if(element.css('float')) {
                jselect.css('float', element.css('float'));
            }

            var options = $('<div class="jselect-data" />').css({'position':'absolute', 'display':'none'}).appendTo(jselect);

            element.find('option').each(function() {
                var option = $(this);
                var opt = $('<div class="option" />');
                option.data('$', opt);
                opt.data('value', option.attr('value')).data('option', option).html(option.html());
                var style = option.data('style');
                if(style) {
                    opt.css(style);
                }
                if(multiselect && option.html()) {
                    opt.prepend($('<input type="checkbox">').prop('checked', option.is(':checked')));
                }
                opt.appendTo(options);
            });

            if(multiselect) {
                /*var $option = $('<div class="option all" />').html('Все');
                $option.prepend($('<input type="checkbox">').prop('checked', false));
                $option.prependTo(options);*/
            }

            makeLabel(true);

            if(label) {
                label.click(function(event) {
                    event.preventDefault();
                    input.focus();
                    input.trigger('click');
                });
            }

            var clickfn = function() {
                if(disabled) return;

                if(settings['autocomplete']) {
                    widget.open();
                } else {
                    if(options.is(':hidden')) {
                        widget.open();
                    } else {
                        widget.close();
                    }
                }
            }

            if(input) input.click(clickfn);
            if(span) span.click(clickfn);

            var lastoption = null;

            if(button) {
                button.click(function() {
                    if(disabled) return;

                    if(settings['autocomplete']) {
                        if(options.is(':hidden')) {
                            lastoption = element.find('option:selected');

                            if(input) input.val('');
                            if(span) span.html('');
                        }
                    }

                    options.find('.option').show();

                    if(options.is(':hidden')) {
                        widget.open();
                    } else {
                        widget.close();
                    }
                });
            }

            initEvents();

            if(disabled) {
                jselect.addClass('disabled');
                if(input) {
                    input.prop('disabled', true);
                }
            }

            if(settings['autocomplete'] && input) {
                input.on('focusout', function() {
                    if(disabled) return;

                    var selected = element.find('option:selected');
                    if(selected.length) {
                        if(input) input.val(selected.text());
                        if(span) span.html(selected.html());

                        if(label && !input.val()) {
                            label.show();
                        }
                    }
                });

                input.on('keyup', function() {
                    if(disabled) return;

                    setTimeout(function() {
                        autocomplete(input.val());
                    }, 10)
                });
                input.on('paste', function() {
                    if(disabled) return;

                    setTimeout(function() {
                        autocomplete(input.val());
                    }, 10)
                });
            } else {
                if(input) input.css({'cursor':'pointer'}).attr('readonly', true);
            }
        });
    }
})(jQuery)