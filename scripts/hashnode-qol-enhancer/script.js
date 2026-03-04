// ==UserScript==
// @name         Hashnode QoL Enhancer
// @namespace    https://github.com/lufcmattylad
// @version      26.1.2
// @description  Preview button on Hashnode draft editor + Edit button on *.hashnode.dev posts
// @author       Matt Mulvaney - @Matt_Mulvaney
// @match        https://hashnode.com/draft/*
// @match        https://hashnode.com/drafts*
// @match        https://*.hashnode.dev/*
// @run-at       document-idle
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/lufcmattylad/hashnode-userscripts/refs/heads/main/scripts/hashnode-qol-enhancer/script.js
// ==/UserScript==

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Config
  // ---------------------------------------------------------------------------

  // Hardcode your blog host here, e.g. "blog.yourdomain.com" or "yourname.hashnode.dev"
  const HASHNODE_BLOG_HOST = '';

  // ---------------------------------------------------------------------------
  // Shared helpers
  // ---------------------------------------------------------------------------

  function onDomReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  let lastUrl = location.href;

  function dispatchUrlChange() {
    window.dispatchEvent(new Event('tm-url-change'));
  }

  function hookHistoryGlobal() {
    const origPushState = history.pushState;
    const origReplaceState = history.replaceState;

    if (!origPushState.__tmPatched) {
      history.pushState = function (...args) {
        const ret = origPushState.apply(this, args);
        dispatchUrlChange();
        return ret;
      };
      history.pushState.__tmPatched = true;
    }

    if (!origReplaceState.__tmPatched) {
      history.replaceState = function (...args) {
        const ret = origReplaceState.apply(this, args);
        dispatchUrlChange();
        return ret;
      };
      history.replaceState.__tmPatched = true;
    }

    window.addEventListener('popstate', dispatchUrlChange);
  }

  function onUrlChangeGlobal() {
    const current = location.href;
    if (current === lastUrl) return;
    lastUrl = current;

    // Preview button: hashnode.com/draft/*
    const existingPreview = document.querySelector('[data-tm-preview-btn="true"]');
    if (existingPreview && getDraftIdFromUrl() == null) {
      existingPreview.remove();
    }
    injectPreviewButton();

    // Edit button: *.hashnode.dev
    removeStaleEditButtonIfWrongPage();
    injectEditButton();
  }

  // ---------------------------------------------------------------------------
  // Part 1: Draft preview button (hashnode.com/draft/*)
  // ---------------------------------------------------------------------------

  function getDraftIdFromUrl() {
    const parts = window.location.pathname.split('/');
    if (parts[1] !== 'draft') return null;
    return parts[2] || null;
  }

  function buildPreviewUrl() {
    const blog = HASHNODE_BLOG_HOST || null;
    const id = getDraftIdFromUrl();

    if (!blog) {
      alert('HASHNODE_BLOG_HOST is not set. Please edit the userscript and set a valid blog host.');
      return null;
    }

    if (!id) {
      alert('Could not determine draft ID from the current URL.');
      return null;
    }

    return `https://${blog}/preview/${id}`;
  }

  function createPreviewButton() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Preview';
    btn.setAttribute('data-tm-preview-btn', 'true');

    Object.assign(btn.style, {
      marginLeft: '0.5rem',
      padding: '0.25rem 0.75rem',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      border: '1px solid rgba(148, 163, 184, 0.7)',
      background: 'transparent',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      whiteSpace: 'nowrap'
    });

    btn.addEventListener('click', () => {
      const url = buildPreviewUrl();
      if (!url) {
        // buildPreviewUrl already shows a specific alert
        return;
      }
      window.open(url, '_blank', 'noopener');
    });

    return btn;
  }

  function injectPreviewButton() {
    if (!location.hostname.endsWith('hashnode.com')) return;
    if (getDraftIdFromUrl() == null) return;
    if (document.querySelector('[data-tm-preview-btn="true"]')) return;

    const ellipsisIcon = document.querySelector(
      'button i.fa-regular.fa-ellipsis,' +
      'button i[class*="fa-ellipsis"],' +
      'button svg.lucide-ellipsis'
    );
    if (!ellipsisIcon) return;

    const hostButton = ellipsisIcon.closest('button');
    if (!hostButton || !hostButton.parentElement) return;

    const previewBtn = createPreviewButton();
    hostButton.parentElement.insertBefore(previewBtn, hostButton.nextSibling);
  }

  function setupMutationObserverForPreview() {
    if (!location.hostname.endsWith('hashnode.com')) return;
    const obs = new MutationObserver(() => injectPreviewButton());
    obs.observe(document.body, { childList: true, subtree: true });
  }

  function initPreviewFeature() {
    setupMutationObserverForPreview();
    injectPreviewButton();
  }

  // ---------------------------------------------------------------------------
  // Part 2: Edit button on *.hashnode.dev posts
  // ---------------------------------------------------------------------------

  function isProbablePostPage() {
    const path = window.location.pathname;
    if (path === '/' || path === '') return false;
    const parts = path.split('/').filter(Boolean);
    return parts.length === 1;
  }

  // Always fetch the current URL fresh — never rely on stale in-memory scripts
  async function fetchCuidForCurrentPost() {
    const url = window.location.href;
    try {
      const res = await fetch(url);
      const html = await res.text();
      const m = html.match(/\\"cuid\\":\\"([^"]+)\\"/);
      return m ? m[1] : null;
    } catch (e) {
      console.error('TM: failed to fetch page for CUID', e);
      return null;
    }
  }

  function createEditButton() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Edit';
    btn.setAttribute('data-tm-edit-btn', 'true');

    Object.assign(btn.style, {
      marginRight: '0.5rem',
      padding: '0.25rem 0.75rem',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      border: '1px solid rgba(148, 163, 184, 0.7)',
      background: 'transparent',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      whiteSpace: 'nowrap'
    });

    btn.addEventListener('click', async () => {
      btn.textContent = '...';
      btn.disabled = true;

      const cuid = await fetchCuidForCurrentPost();

      btn.textContent = 'Edit';
      btn.disabled = false;

      if (!cuid) {
        alert('Could not find cuid for this post.');
        return;
      }

      window.open(`https://hashnode.com/edit/${cuid}`, '_blank', 'noopener');
    });

    return btn;
  }

  function removeStaleEditButtonIfWrongPage() {
    const btn = document.querySelector('[data-tm-edit-btn="true"]');
    if (btn && (!location.hostname.endsWith('.hashnode.dev') || !isProbablePostPage())) {
      btn.remove();
    }
  }

  function injectEditButton() {
    if (!location.hostname.endsWith('.hashnode.dev')) return;
    if (!isProbablePostPage()) {
      removeStaleEditButtonIfWrongPage();
      return;
    }
    if (document.querySelector('[data-tm-edit-btn="true"]')) return;

    const writeButton = Array.from(document.querySelectorAll('a'))
      .find(a => a.textContent.trim() === 'Write');
    if (!writeButton || !writeButton.parentElement) return;

    const editBtn = createEditButton();
    writeButton.parentElement.insertBefore(editBtn, writeButton);
  }

  function setupMutationObserverForEdit() {
    if (!location.hostname.endsWith('.hashnode.dev')) return;
    const obs = new MutationObserver(() => {
      removeStaleEditButtonIfWrongPage();
      injectEditButton();
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  function initEditFeature() {
    setupMutationObserverForEdit();
    injectEditButton();
  }

  // ---------------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------------

  onDomReady(() => {
    hookHistoryGlobal();
    window.addEventListener('tm-url-change', onUrlChangeGlobal);
    initPreviewFeature();
    initEditFeature();
  });

})();
