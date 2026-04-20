function getCodeText(codeBlock) {
    if (codeBlock.dataset.rawCode) {
        return codeBlock.dataset.rawCode;
    }

    const code = codeBlock.querySelector('.shiki code, pre.highlight code, pre > code, pre.highlight, pre');
    if (!code) {
        return '';
    }

    return code.innerText || code.textContent || '';
}

function attachCopyButtons(root = document) {
    const codeBlocks = root.querySelectorAll('.highlighter-rouge, .shiki-frame');

    codeBlocks.forEach((codeBlock) => {
        if (codeBlock.dataset.copyReady === 'true') {
            return;
        }

        const codeText = getCodeText(codeBlock);
        if (!codeText.trim()) {
            return;
        }

        const copyButton = document.createElement('button');
        copyButton.className = 'copy-code-button';
        copyButton.type = 'button';
        copyButton.textContent = 'Copy';

        codeBlock.style.position = 'relative';
        codeBlock.dataset.copyReady = 'true';
        codeBlock.appendChild(copyButton);

        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(getCodeText(codeBlock)).then(() => {
                copyButton.textContent = 'Copied!';
                setTimeout(() => {
                    copyButton.textContent = 'Copy';
                }, 2000);
            }).catch((err) => {
                copyButton.textContent = 'Failed!';
                console.error('Failed to copy text: ', err);
            });
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const pending = window.shikiRenderPromise;

    if (pending && typeof pending.finally === 'function') {
        pending.finally(() => attachCopyButtons());
        return;
    }

    attachCopyButtons();
});

document.addEventListener('shiki:rendered', () => {
    attachCopyButtons();
});
