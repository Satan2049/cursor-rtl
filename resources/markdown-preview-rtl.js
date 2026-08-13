(function() {
    var RTL_TEXT = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u0870-\u089F\u08A0-\u08FF\uFB1D-\uFB4F\uFB50-\uFDFF\uFE70-\uFEFE]/g;
    var DIR_SELECTOR = 'p, li, h1, h2, h3, h4, h5, h6, blockquote, ul, ol, table, th, td';
    var CODE_EXCLUDE = 'code, pre, .hljs';

    function getMatches(text, pattern) {
        return text.match(pattern) || [];
    }

    function getLtrTokenWeight(token) {
        if (/[._/\\:]/.test(token)) return 0.25;
        if (/^[A-Z0-9-]{2,}$/.test(token)) return 0.5;
        if (/^[a-z]+[A-Z]/.test(token)) return 0.5;
        return 1;
    }

    function getTextDir(text) {
        var value = text || '';
        var rtlRuns = getMatches(value, RTL_TEXT);
        var ltrTokens = getMatches(value, /[A-Za-z][A-Za-z0-9._/\\:-]*/g);
        if (rtlRuns.length === 0) return 'ltr';
        if (ltrTokens.length === 0) return 'rtl';

        var rtlScore = rtlRuns.length * 1.5;
        var ltrScore = 0;
        for (var i = 0; i < ltrTokens.length; i++) {
            ltrScore += getLtrTokenWeight(ltrTokens[i]);
        }
        return rtlScore >= ltrScore ? 'rtl' : 'ltr';
    }

    function getMajorityDir(els) {
        var rtlCount = 0;
        var ltrCount = 0;
        for (var i = 0; i < els.length; i++) {
            if (getTextDir(els[i].textContent || '') === 'rtl') rtlCount++;
            else ltrCount++;
        }
        return rtlCount > ltrCount ? 'rtl' : 'ltr';
    }

    function getDesiredDir(el) {
        if (el.matches && el.matches('ol, ul')) {
            var items = el.querySelectorAll(':scope > li');
            return items.length > 0 ? getMajorityDir(items) : getTextDir(el.textContent || '');
        }
        if (el.matches && el.matches('table')) {
            var cells = el.querySelectorAll(':scope th, :scope td');
            return cells.length > 0 ? getMajorityDir(cells) : getTextDir(el.textContent || '');
        }
        return getTextDir(el.textContent || '');
    }

    function applyDir() {
        var els = document.querySelectorAll(DIR_SELECTOR);
        for (var i = 0; i < els.length; i++) {
            if (els[i].closest(CODE_EXCLUDE)) continue;
            els[i].setAttribute('dir', getDesiredDir(els[i]));
        }
        if (document.body) {
            document.body.setAttribute('dir', getDesiredDir(document.body));
        }
    }

    applyDir();
    document.addEventListener('DOMContentLoaded', applyDir);
})();
