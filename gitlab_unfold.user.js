// ==UserScript==
// @name GitLab unfold
// @namespace http://github.com/kkHAIKE/gitlab_unfold
// @match *://*/merge_requests/*/diffs
// @match *://*/commit/*
// @grant GM_log
// @grant GM_xmlhttpRequest
// @grant unsafeWindow
// ==/UserScript==

unsafeWindow.magic = function() {
    $('.js-unfold.old_line').each(function(idx, x) {
        var $x = $(x);

        // 排除第一行
        if ($x.parent().prev().length == 0) {
            return;
        }

        // 排除最后一行向下
        if ($x.hasClass('js-unfold-bottom')) {
            return;
        }

        // 替换 class
        $x.removeClass('js-unfold');
        $x.addClass('js-unfold-d');
    });
};

(function() {
    $(document).on('click', '.js-unfold-d', function(e) {
        var lineNumbers = function(x) {
            var lns = x.find('.diff-line-num').toArray();
            return [parseInt($(lns[0]).data('linenumber')), parseInt($(lns[1]).data('linenumber'))];
        };

        var dictToQuery = function(dict) {
            var k, tmp, v;
            tmp = [];
            for (k in dict) {
              v = dict[k];
              tmp.push((encodeURIComponent(k)) + "=" + (encodeURIComponent(v)));
            }
            return tmp.join('&');
        };

        var $target = $(e.target);
        var prevlns = lineNumbers($target.parent().prev());

        var offset = prevlns[1] - prevlns[0];
        var unfold = true;
        var bottom = true;

        var lineNumber = prevlns[1] + 1;
        var since = lineNumber;
        var to = lineNumber + 20;

        var nextnewln = lineNumbers($target.parent().next())[1];
        if (to >= nextnewln - 1) {
            to = nextnewln - 1;
            unfold = false;
        }

        var $file = $target.parents('.diff-file');
        var link = $file.data('blobDiffPath');
        var view = $file.data('view');

        var pp = { since, to, bottom, offset, unfold, view };

        GM_xmlhttpRequest({
            method: 'GET',
            url: link + '?' + dictToQuery(pp),
            onload: function(response) {
                if (response.status === 200) {
                    if (unfold) {
                        // 插入之前
                        $target.parent().before(response.responseText);
                        // 删除最后
                        $target.parent().prev().remove();
                    } else {
                        $target.parent().replaceWith(response.responseText);
                    }
                } else {
                    GM_log(response);
                }
            }
        });
    });

    magic();
})();
