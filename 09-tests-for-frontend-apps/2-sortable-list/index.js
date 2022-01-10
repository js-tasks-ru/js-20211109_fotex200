export default class SortableList {
  onPointerMove = ({ clientX, clientY }) => {
    this.moveDraggingAt(clientX, clientY);

    const prevElem = this.placeHolderElement.previousElementSibling;
    const nextElem = this.placeHolderElement.nextElementSibling;

    const { firstElementChild, lastElementChild } = this.element;
    const { top: firstElementTop } = firstElementChild.getBoundingClientRect();
    const { bottom } = this.element.getBoundingClientRect();

    if (clientY < firstElementTop) {
      return firstElementChild.before(this.placeHolderElement);
    }

    if (clientY > bottom) {
      return lastElementChild.after(this.placeHolderElement);
    }

    if (prevElem) {
      const { top, height } = prevElem.getBoundingClientRect();
      const middlePrevElem = top + height / 2;

      if (clientY < middlePrevElem) {
        return prevElem.before(this.placeHolderElement);
      }
    }

    if (nextElem) {
      const { top, height } = nextElem.getBoundingClientRect();
      const middleNextElem = top + height / 2;

      if (clientY > middleNextElem) {
        return nextElem.after(this.placeHolderElement);
      }
    }

    this.scrollIfCloseToWindowEdge(clientY);
  }

  onPointerUp = () => {
    this.dragStop();
  }

  constructor ({items = []} = {}) {
    this.items = items;

    this.render();
  }

  render() {
    this.element = document.createElement('ul');
    this.element.className = 'sortable-list';

    this.addItems();
    this.initEventListeners();
  }

  initEventListeners() {
    this.element.addEventListener('pointerdown', e => {
      this.onPointerDown(e);
    })
  }

  scrollIfCloseToWindowEdge(clientY) {
    const scrollingValue = 10;
    const threshold = 20;

    if (clientY < threshold) {
      window.scrollBy(0, -scrollingValue);
    } else if (clientY > document.createElement.clientHeight - threshold) {
      window.scrollBy(0, scrollingValue);
    }
  }

  onPointerDown(e) {
    const element = e.target.closest('.sortable-list__item');

    if (element) {
      if (e.target.closest('[data-grab-handle]')) {
        e.preventDefault();

        this.dragStart(element, e);
      }

      if (e.target.closest('[data-delete-handle]')) {
        e.preventDefault();

        element.remove();
      }
    }
  }

  dragStart(element, {clientX, clientY}) {
    this.draggingElem = element;
    this.elementInitialIndex = [...this.element.children].indexOf(element);

    const { x, y } = element.getBoundingClientRect();
    const { offsetWidth, offsetHeight } = element;

    this.pointerShift = {
      x: clientX - x,
      y: clientY - y
    };

    this.draggingElem.style.width = `${offsetWidth}px`;
    this.draggingElem.style.height = `${offsetHeight}px`;
    this.draggingElem.classList.add('sortable-list__item_dragging');

    this.placeHolderElement = this.createPlaceholderElement(offsetWidth, offsetHeight);

    this .draggingElem.after(this.placeHolderElement);
    this.element.append(this.draggingElem);
    this.moveDraggingAt(clientX, clientY);
    this.addDocumentEventListeners();
  }

  createPlaceholderElement(width, height) {
    const element = document.createElement('li');

    element.className = 'sortable-list__placeholder';
    element.style.width = `${width}px`;
    element.style.height = `${height}px`;

    return element;
  }

  addDocumentEventListeners() {
    document.addEventListener('pointermove', this.onPointerMove);
    document.addEventListener('pointerup', this.onPointerUp);
  }

  dragStop() {
    const placeHolderIndex = [...this.element.children].indexOf(this.placeHolderElement);

    this.draggingElem.style.cssText = '';
    this.draggingElem.classList.remove('sortable-list__item_dragging');
    this.placeHolderElement.replaceWith(this.draggingElem);
    this.draggingElem = null;

    this.removeDocumentEventListeners();

    if (placeHolderIndex !== this.elementInitialIndex) {
      this.dispatchEvent('srtable-list-reorder', {
        from: this.elementInitialIndex,
        to: placeHolderIndex
      });
    }
  }

  removeDocumentEventListeners() {
    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerUp);
  }

  addItems() {
    for (const item of this.items) {
      item.classList.add('sortable-list__item');
    }

    this.element.append(...this.items);
  }

  moveDraggingAt(clientX, clientY) {
    this.draggingElem.style.left = `${clientX - this.pointerShift.x}px`;
    this.draggingElem.style.top = `${clientY - this.pointerShift.y}px`;
  }

  dispatchEvent(type, details) {
    this.element.dispatchEvent(new CustomEvent(type, {
      bubbles: true,
      details
    }))
  }

  remove() {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy() {
    this.remove();
    this.removeDocumentEventListeners();
    this.element = null;
  }
}
