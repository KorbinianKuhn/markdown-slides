export class Clipboard {
  public copy(id: string) {
    navigator.clipboard.writeText(document.getElementById(id)!.innerText);
    const toast = document.createElement('div');
    toast.classList.add('toast-wrapper');
    // Announced by screen readers
    toast.setAttribute('role', 'status');
    const content = document.createElement('div');
    content.classList.add('toast');
    content.textContent = 'Copied to clipboard';
    toast.appendChild(content);
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 2000);
  }
}
