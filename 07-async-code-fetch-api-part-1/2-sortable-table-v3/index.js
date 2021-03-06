// пока что не тратьте время, ГАРАЖ ПОКА ЧТО В РАЗРАБОТКЕ :D
import fetchJson from './utils/fetch-json.js';

const BACKEND_URL = 'https://course-js.javascript.ru';

export default class SortableTable {
  element;
  subElements = {};
  data = [];
  loading = false;
  step = 20;
  start = 1;
  end = this.start + this.step;

  onWindowScroll = async (ev) => {
    const { bottom } = this.element.getBoundingClientRect();
    const { id, order } = this.sorted;

    if (bottom < document.documentElement.clientHeight && ! this.loading && !this.isSortLocally) {
      this.start = this.end;
      this.end = this.start + this.step;

      this.loading = true;

      const data = await this.loadData(id, order, this.start, this.end);
      this.update(data);

      this.loading = false;
    }

  }

  onClickSort = ev => {
    const sortableCell = ev.target.closest('.sortable-table__cell');
    if (!sortableCell) return;
    if (!ev.currentTarget.contains(sortableCell)) return;
    if (sortableCell.dataset.sortable === 'false') return;

    const toggleOrder = order => {
      const orders = {
        asc: 'desc',
        desc: 'asc'
      }

      return orders[order]
    };

    const { id, order } = sortableCell.dataset;
    const newOrder = toggleOrder(order);

    this.sorted = {
      id,
      order: newOrder
    }

    sortableCell.dataset.order = newOrder;
    sortableCell.append(this.subElements.arrow);

    if (this.isSortLocally) {
      this.sortOnClient(id, newOrder);
    } else {
      this.sortOnServer(id, newOrder);
    }

  }

  constructor(headerConfig, {
    url = '',
    isSortLocally = false,
    sorted = {
      id: headerConfig.find(item => item.sortable).id,
      order: 'asc',
    },
    step = 20,
    start = 1,
    end = start + step
  } = {}) {
    this.headerConfig = headerConfig;
    this.url = new URL(url, BACKEND_URL);
    this.sorted = sorted;
    this.isSortLocally = isSortLocally;
    this.step = step;
    this.start = start;
    this.end = end;

    this.render();
  }

  async loadData(id, order, start = this.start, end = this.end ) {
    this.url.searchParams.set('_sort', id);
    this.url.searchParams.set('_order', order);
    this.url.searchParams.set('_start', start);
    this.url.searchParams.set('_end', end);

    this.element.classList.add('sortable-table_loading');

    const data = await fetchJson(this.url);

    this.element.classList.remove('sortable-table_loading');

    return data;
  }

  sortOnClient(id, order) {
    const sortedData = this.sortData(id, order);

    this.getTableBody(sortedData);
  }

  async sortOnServer(id, order) {
    const start = 1;
    const end = start + this.step;
    const data = await this.loadData(id, order, start, end);

    this.renderRows(data);
  }

  sortData(id, order) {
    const arr = [...this.data];
    const sortColumn = this.headerConfig.find(item => item.id === id);
    const {sortType, customSorting} = sortColumn;
    const direction = order === 'asc' ? 1 : -1;

    return arr.sort((a, b) => {
      switch (sortType) {
        case 'number':
          return direction * (a[id] - b[id]);

        case 'string':
          return direction * a[id].localeCompare(b[id], 'ru');

        default:
          return direction * (a[id] - b[id]);

      }
    });
  }

  get template() {
    return `
      <div class="sortable-table">
        <div data-element="header" class="sortable-table__header sortable-table__row">
          ${this.getTableHeader()}
        </div>
        <div data-element="body" class="sortable-table__body"></div>
      </div>
    `;
  }

  async render() {
    const {id, order} = this.sorted;
    const element = document.createElement('div');
    element.innerHTML = this.template;
    this.element = element.firstElementChild;
    this.subElements = this.getSubElements(this.element);

    const data = await this.loadData(id, order, this.start, this.end);

    this.renderRows(data);
    this.addEventListners();
  }

  update(data) {
    const rows = document.createElement('div');
    this.data = [...this.data, ...data];
    rows.innerHTML = this.getTableBody(data);

    this.subElements.body.append(...rows.childNodes);
  }

  renderRows(data) {
    if (data.length) {
      this.element.classList.remove('sortable-table_empty');
      this.addRows(data);
    } else {
      this.element.classList.add('sortable-table_empty');
    }
  }

  addRows(data) {
    this.data = data;

    this.subElements.body.innerHTML = this.getTableBody(data);
  }

  setHeaderDirectionArrow(field, order) {
    const elements = this.subElements.header.querySelectorAll("[data-id]");

    for (const el of elements) {
      (el.dataset.id === field) ? el.dataset.order = order : el.dataset.order = '';
    }
  }

  addEventListners() {
    this.subElements.header.addEventListener('pointerdown', this.onClickSort);
    document.addEventListener('scroll', this.onWindowScroll);
  }

  getTableHeader() {
    return this.headerConfig.map(({ id, title, sortable} = headerData) => {
      const order = this.sorted.id === id ? this.sorted.order : 'asc';

      return `
        <div class="sortable-table__cell" data-id="${id}" data-sortable="${sortable}" data-order="${order}">
          <span>${title}</span>
          ${this.getHeaderSortingArrow(id)}
        </div>

      `
    }).join('');
  }

  getHeaderSortingArrow(id) {
    const isOrderExist = this.sorted.id === id ? this.sorted.order : '';

    return isOrderExist
      ? `<span data-element="arrow" class="sortable-table__sort-arrow">
          <span class="sort-arrow"></span>
        </span>`
      : '';
  }

  getTableBody(data) {
    this.data = data;
    return data.map((productData) => {
      return `
        <a href="#" class="sortable-table__row">
          ${this.getTableBodyCell(productData)}
        </a>
      `
    }).join('');
  }

  getTableBodyCell(productData) {
    const productDataKeys = Object.keys(productData);
    const productCellArray = [];

    for (const { id, template = null } of this.headerConfig) {
      if (productDataKeys.includes(id)) {
        const productCell = template ? template(productData[id])
          : `<div class="sortable-table__cell">${productData[id]}</div>`;

        productCellArray.push(productCell);
      }
    }

    return productCellArray.join('');
  }

  getSubElements(element) {
    const elements = element.querySelectorAll('[data-element]');

    const result = [...elements].reduce((accum, subElement) => {
      accum[subElement.dataset.element] = subElement;

      return accum;
    }, {});

    return result;
  }

  destroy() {
    this.element = null;
    this.subElements = {};
    return this.remove();
  }

  remove() {
    if (this.element) {
      return this.element.remove();
    }
  }
}

