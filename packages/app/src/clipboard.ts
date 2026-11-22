import { texts } from './texts';

export class Clipboard {
  public async copy(id: string) {
    const text = document.getElementById(id)!.innerText;
    const copied = (await this.writeText(text)) || this.copyBySelection(text);
    this.showToast(copied ? texts.copied : texts.copyFailed);
  }

  /**
   * The Clipboard API is missing outside of secure contexts, e.g. on
   * http:// pages other than localhost, and can be denied.
   */
  private async writeText(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  /** The older way, which also works outside of secure contexts */
  private copyBySelection(text: string): boolean {
    const focused = document.activeElement as HTMLElement | null;
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    let copied: boolean;
    try {
      copied = document.execCommand('copy');
    } catch {
      copied = false;
    }
    textarea.remove();
    focused?.focus({ preventScroll: true });
    return copied;
  }

  private showToast(text: string) {
    const toast = document.createElement('div');
    toast.classList.add('toast-wrapper');
    // Announced by screen readers
    toast.setAttribute('role', 'status');
    const content = document.createElement('div');
    content.classList.add('toast');
    content.textContent = text;
    toast.appendChild(content);
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 2000);
  }
}
