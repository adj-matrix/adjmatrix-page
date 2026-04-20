const SHIKI_IMPORT_URL = 'https://esm.sh/shiki@4.0.2';
const SHIKI_THEMES = {
    light: 'light-plus',
    dark: 'dark-plus',
};
const SHIKI_ROOT = document.documentElement;

const LANGUAGE_ALIASES = new Map([
    ['Dockerfile', 'docker'],
    ['asm', 'asm'],
    ['bash', 'bash'],
    ['cpp', 'cpp'],
    ['c++', 'cpp'],
    ['docker', 'docker'],
    ['dockerfile', 'docker'],
    ['html', 'html'],
    ['js', 'javascript'],
    ['json', 'json'],
    ['jsx', 'jsx'],
    ['md', 'markdown'],
    ['nasm', 'asm'],
    ['plaintext', 'text'],
    ['py', 'python'],
    ['rb', 'ruby'],
    ['shell', 'bash'],
    ['sh', 'bash'],
    ['text', 'text'],
    ['ts', 'typescript'],
    ['tsx', 'tsx'],
    ['txt', 'text'],
    ['xml', 'xml'],
    ['yaml', 'yaml'],
    ['yml', 'yaml'],
    ['zsh', 'bash'],
]);

const ASM_LANGUAGES = new Set(['asm']);
const OBJDUMP_HEADER_RE = /^\s*([0-9a-f]+)\s+<([^>]+)>:\s*$/i;
const OBJDUMP_INSTRUCTION_RE = /^\s*([0-9a-f]+):\s*(([0-9a-f]{2}(?:\s+[0-9a-f]{2})*)?)\s*(.*)$/i;

function escapeHtml(value) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function normalizeLanguage(rawLanguage) {
    if (!rawLanguage) {
        return 'text';
    }

    return LANGUAGE_ALIASES.get(rawLanguage) ||
        LANGUAGE_ALIASES.get(rawLanguage.toLowerCase()) ||
        rawLanguage.toLowerCase();
}

function detectLanguage(codeBlock) {
    const elements = [codeBlock, ...codeBlock.querySelectorAll('[class]')];

    for (const element of elements) {
        for (const className of element.classList) {
            const match = className.match(/^language-(.+)$/);
            if (match) {
                return normalizeLanguage(match[1]);
            }
        }
    }

    return 'text';
}

function extractRawCode(codeBlock) {
    if (codeBlock.dataset.rawCode) {
        return codeBlock.dataset.rawCode;
    }

    const source = codeBlock.querySelector('pre code, pre.highlight code, pre > code, pre.highlight, pre');
    return source ? (source.textContent || '') : '';
}

function isObjdumpLike(code) {
    const lines = code.replace(/\r\n?/g, '\n').split('\n');
    let headerCount = 0;
    let instructionCount = 0;

    for (const line of lines) {
        if (OBJDUMP_HEADER_RE.test(line)) {
            headerCount += 1;
            continue;
        }

        const match = line.match(OBJDUMP_INSTRUCTION_RE);
        if (match && match[2] && match[3]) {
            instructionCount += 1;
        }
    }

    return instructionCount >= 2 && headerCount + instructionCount >= 3;
}

function parseObjdump(code) {
    const items = [];
    const lines = code.replace(/\r\n?/g, '\n').split('\n');

    for (const line of lines) {
        if (line.trim() === '') {
            items.push({ kind: 'blank', text: '' });
            continue;
        }

        const headerMatch = line.match(OBJDUMP_HEADER_RE);
        if (headerMatch) {
            items.push({
                kind: 'header',
                address: headerMatch[1],
                symbol: headerMatch[2],
            });
            continue;
        }

        const instructionMatch = line.match(OBJDUMP_INSTRUCTION_RE);
        if (instructionMatch && instructionMatch[2] && instructionMatch[3]) {
            items.push({
                kind: 'instruction',
                address: instructionMatch[1],
                bytes: instructionMatch[2].trim(),
                asm: instructionMatch[3],
            });
            continue;
        }

        items.push({ kind: 'plain', text: line });
    }

    return items;
}

function extractHighlightedLines(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const pre = doc.querySelector('pre.shiki');
    const code = doc.querySelector('pre.shiki code');

    return {
        pre,
        codeClassName: code ? code.className : '',
        lines: code ? [...code.querySelectorAll('.line')].map((line) => line.innerHTML) : [],
    };
}

function buildObjdumpHtml(preTemplate, codeClassName, items, highlightedLines) {
    const pre = document.createElement('pre');
    pre.className = `${preTemplate.className} shiki-objdump`.trim();

    const preStyle = preTemplate.getAttribute('style');
    if (preStyle) {
        pre.setAttribute('style', preStyle);
    }

    pre.tabIndex = 0;

    const code = document.createElement('code');
    if (codeClassName) {
        code.className = codeClassName;
    }

    let lineIndex = 0;

    for (const item of items) {
        const line = document.createElement('span');
        line.className = 'line shiki-objdump-line';

        if (item.kind === 'header') {
            line.classList.add('is-header');
            line.innerHTML =
                `<span class="objdump-address">${escapeHtml(item.address)}</span>` +
                `<span class="objdump-label">&lt;${escapeHtml(item.symbol)}&gt;:</span>`;
            code.appendChild(line);
            continue;
        }

        const highlightedLine = highlightedLines[lineIndex] || '';
        lineIndex += 1;

        if (item.kind === 'instruction') {
            line.innerHTML =
                `<span class="objdump-address">${escapeHtml(item.address)}:</span>` +
                `<span class="objdump-bytes">${escapeHtml(item.bytes)}</span>` +
                `<span class="objdump-asm">${highlightedLine || '&nbsp;'}</span>`;
            code.appendChild(line);
            continue;
        }

        if (item.kind === 'plain') {
            line.classList.add('is-plain');
            line.innerHTML = `<span class="objdump-plain">${highlightedLine || escapeHtml(item.text)}</span>`;
            code.appendChild(line);
            continue;
        }

        line.classList.add('is-plain');
        line.innerHTML = '<span class="objdump-plain">&nbsp;</span>';
        code.appendChild(line);
    }

    pre.appendChild(code);
    return pre.outerHTML;
}

async function renderObjdumpBlock(codeToHtml, rawCode) {
    const items = parseObjdump(rawCode);
    const highlightedText = items
        .filter((item) => item.kind !== 'header')
        .map((item) => {
            if (item.kind === 'instruction') {
                return item.asm;
            }

            return item.text;
        })
        .join('\n');

    const shikiHtml = await codeToHtml(highlightedText, {
        lang: 'asm',
        themes: SHIKI_THEMES,
        defaultColor: false,
    });

    const { pre, codeClassName, lines } = extractHighlightedLines(shikiHtml);
    if (!pre) {
        return shikiHtml;
    }

    return buildObjdumpHtml(pre, codeClassName, items, lines);
}

async function highlightCodeBlock(codeToHtml, codeBlock) {
    const rawCode = extractRawCode(codeBlock);
    if (!rawCode.trim()) {
        return;
    }

    const language = detectLanguage(codeBlock);
    codeBlock.dataset.rawCode = rawCode;
    codeBlock.dataset.codeLanguage = language;

    let html;

    try {
        if (ASM_LANGUAGES.has(language) && isObjdumpLike(rawCode)) {
            codeBlock.dataset.shikiMode = 'objdump';
            html = await renderObjdumpBlock(codeToHtml, rawCode);
        } else {
            codeBlock.dataset.shikiMode = 'default';
            html = await codeToHtml(rawCode, {
                lang: language,
                themes: SHIKI_THEMES,
                defaultColor: false,
            });
        }
    } catch (error) {
        console.warn(`Shiki could not highlight "${language}", falling back to text.`, error);
        codeBlock.dataset.shikiMode = 'fallback';
        html = await codeToHtml(rawCode, {
            lang: 'text',
            themes: SHIKI_THEMES,
            defaultColor: false,
        });
    }

    codeBlock.innerHTML = html;
    codeBlock.classList.add('shiki-frame');
}

async function renderAllCodeBlocks() {
    const codeBlocks = [...document.querySelectorAll('.content-wrapper .highlighter-rouge')];
    if (!codeBlocks.length) {
        SHIKI_ROOT.classList.remove('shiki-pending');
        SHIKI_ROOT.classList.add('shiki-ready');
        return;
    }

    if (window.__shikiBoot?.cancelled) {
        SHIKI_ROOT.classList.remove('shiki-pending');
        SHIKI_ROOT.classList.add('shiki-skipped');
        return;
    }

    const { codeToHtml } = await import(SHIKI_IMPORT_URL);

    if (window.__shikiBoot?.cancelled) {
        SHIKI_ROOT.classList.remove('shiki-pending');
        SHIKI_ROOT.classList.add('shiki-skipped');
        return;
    }

    for (const codeBlock of codeBlocks) {
        await highlightCodeBlock(codeToHtml, codeBlock);
    }

    SHIKI_ROOT.classList.remove('shiki-pending');
    SHIKI_ROOT.classList.add('shiki-ready');
    document.dispatchEvent(new CustomEvent('shiki:rendered'));
}

window.shikiRenderPromise = renderAllCodeBlocks().catch((error) => {
    console.error('Shiki failed to render code blocks.', error);
    SHIKI_ROOT.classList.remove('shiki-pending');
    SHIKI_ROOT.classList.add('shiki-failed');
});
