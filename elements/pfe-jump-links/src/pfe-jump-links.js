import PFElement from "../../pfelement/dist/pfelement.js";
import PfeAccordion from "../../pfe-accordion/dist/pfe-accordion.js";

const pfeJumpLinksNavObserverConfig = {
  childList: true,
  subtree: true,
  characterData: true,
  attributes: true
};

const pfeJumpLinksPanelObserverConfig = {
  childList: true,
  subtree: true,
  characterData: true,
  attributes: true
};

class PfeJumpLinks extends PFElement {
  static get tag() {
    return "pfe-jump-links";
  }

  get schemaUrl() {
    return "pfe-jump-links.json";
  }

  get templateUrl() {
    return "pfe-jump-links.html";
  }

  get styleUrl() {
    return "pfe-jump-links.scss";
  }

  static get PfeType() {
    return PFElement.PfeTypes.Content;
  }

  constructor() {
    super(PfeJumpLinks, { type: PfeJumpLinks.PfeType });
  }
}

class PfeJumpLinksNav extends PFElement {
  static get tag() {
    return "pfe-jump-links-nav";
  }

  get schemaUrl() {
    return "pfe-jump-links-nav.json";
  }

  get templateUrl() {
    return "pfe-jump-links-nav.html";
  }

  get styleUrl() {
    return "pfe-jump-links-nav.scss";
  }

  static get PfeType() {
    return PFElement.PfeTypes.Content;
  }

  static get properties() {
    return {
      autobuild: {
        title: "Autobuild",
        type: Boolean
      },
      horizontal: {
        title: "Horizontal",
        type: Boolean
      },
      srText: {
        title: "Screen reader text",
        type: String,
        default: "Jump to section"
      },
      color: {
        title: "Color",
        type: String
      },
      // @TODO: Deprecated in 1.0
      oldColor: {
        alias: "color",
        attr: "pfe-color"
      }
    };
  }

  constructor() {
    super(PfeJumpLinksNav, { type: PfeJumpLinksNav.PfeType });
    this._buildNav = this._buildNav.bind(this);
    this._init = this._init.bind(this);
    this._reportHeight = this._reportHeight.bind(this);
    this.closeAccordion = this.closeAccordion.bind(this);
    this._closeAccordion = this._closeAccordion.bind(this);

    this._observer = new MutationObserver(this._init);

    this._nav = this.shadowRoot.querySelector("nav");
    this._mobileHeader = this.shadowRoot.querySelector("pfe-accordion-header");
    this._accordion = this.shadowRoot.querySelector("pfe-accordion");
    this._container = this.shadowRoot.querySelector("#container");

    window.addEventListener("resize", () => {});
  }

  connectedCallback() {
    super.connectedCallback();
    this.panel = document.querySelector(`[scrolltarget=${this.id}]`);

    this._init();

    this._observer.observe(this, pfeJumpLinksNavObserverConfig);

    this.panel = document.querySelector(`[scrolltarget="${this.id}"]`);

    if (this.panel) this.panel.addEventListener(PfeJumpLinksPanel.events.change, this._buildNav);

    this.links = this.shadowRoot.querySelectorAll("a");
    [...this.links].forEach(link => {
      link.addEventListener("click", this.closeAccordion);
    });
  }

  _init() {
    if (window.ShadyCSS) this._observer.disconnect();

    if (this.autobuild) {
      this._buildNav();
    } else {
      //Check that the light DOM is valid
      if (this._isValidLightDom()) {
        const menu = this.querySelector("ul");
        if (menu) {
          menu.classList.add(this.tag);
          this._container.innerHTML = menu.outerHTML;
        }

        this._copyHeader();
      }
    }

    this._reportHeight();

    if (window.ShadyCSS) this._observer.observe(this, pfeJumpLinksNavObserverConfig);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this._observer.disconnect();
    if (this.panel) this.panel.removeEventListener(PfeJumpLinksPanel.events.change, this._buildNav);
    this.removeEventListener("click");
    [...this.links].forEach(link => {
      link.removeEventListener("click", this.closeAccordion);
    });
  }

  closeAccordion() {
    // @TODO
    // Create JSON tokens for media query breakpoints
    if (window.matchMedia("(min-width: 992px)").matches) {
      return;
    }
    setTimeout(this._closeAccordion, 750);
  }

  _closeAccordion() {
    this.shadowRoot.querySelector(PfeAccordion.tag).collapseAll();
  }

  _rebuildNav() {
    this._buildNav();
  }

  _buildNav() {
    const buildLinkList = () => {
      let linkList = ``;
      if (!this.panel) {
        this.panel = document.querySelector(`[scrolltarget="${this.id}"]`);
      }
      let panelSections = this.panel.querySelectorAll(".pfe-jump-links-panel__section");

      for (let i = 0; i < panelSections.length; i++) {
        let arr = [...panelSections];
        if (arr[i].classList.contains("has-sub-section")) {
          let linkListItem = `
          <li class="pfe-jump-links-nav__item">
            <a
              class="pfe-jump-links-nav__link has-sub-section"
              href="#${arr[i].id}"
              data-target="${arr[i].id}">
                ${arr[i].innerHTML}
            </a>
            <ul class="sub-nav">
        `;
          linkList += linkListItem;
        } else if (arr[i].classList.contains("sub-section")) {
          let linkSubItem = `
        <li class="pfe-jump-links-nav__item">
            <a
              class="pfe-jump-links-nav__link sub-section"
              href="#${arr[i].id}"
              data-target="${arr[i].id}">
                ${arr[i].innerHTML}
            </a>
        </li>`;
          if (!arr[i + 1].classList.contains("sub-section")) {
            linkSubItem += `</ul></li>`;
          }
          linkList += linkSubItem;
        } else {
          let linkListItem = `
          <li class="pfe-jump-links-nav__item">
            <a
              class="pfe-jump-links-nav__link"
              href="#${arr[i].id}"
              data-target="${arr[i].id}">
                ${arr[i].innerHTML}
            </a>
          </li>
        `;
          linkList += linkListItem;
        }
      }
      return linkList;
    };

    this._container.innerHTML = `<ul class="pfe-jump-links-nav">${buildLinkList()}</ul>`;

    this._copyHeader();
  }

  _copyHeader() {
    // Capture the default heading from the shadow DOM
    let label = this.shadowRoot.querySelector("#heading > *:first-child");

    // If a heading slot has been used, copy the content into the template
    if (this.hasSlot(`${this.tag}--heading`)) {
      let heading = this.getSlot(`${this.tag}--heading`)[0];
      if (heading) {
        label = heading.cloneNode(true);
        label.removeAttribute("slot");
      }
    }
    if (!this.horizontal && label) this._mobileHeader.appendChild(label);
  }

  _isValidLightDom() {
    if (!this.hasLightDOM()) {
      this.warn(`You must have a <ul> tag in the light DOM`);
      return false;
    }
    if ((this.hasSlot("logo") || this.hasSlot("link")) && !this.horizontal) {
      this.warn(`logo and link slots NOT supported in vertical jump links`);
    }
    if (this.children[1].tagName !== "UL") {
      if (!this.horizontal) {
        this.warn(`The top-level list of links MUST be a <ul>`);
      }

      return false;
    }

    return true;
  }

  _reportHeight() {
    const cssVarName = `--pfe-jump-links--Height--actual`;
    const styles = window.getComputedStyle(this);

    let navHeight = Number.parseInt(styles.getPropertyValue("height")) || 0;
    let nudge = Number.parseInt(this.cssVariable("jump-links-nav--nudge")) || 0;

    if (window.matchMedia("(min-width: 992px)").matches) {
      navHeight = 0;
    }

    let offset = navHeight + nudge;

    if (this.panel) this.panel.style.setProperty(cssVarName, offset);
  }
}

class PfeJumpLinksPanel extends PFElement {
  static get tag() {
    return "pfe-jump-links-panel";
  }

  get schemaUrl() {
    return "pfe-jump-links-panel.json";
  }

  get templateUrl() {
    return "pfe-jump-links-panel.html";
  }

  get styleUrl() {
    return "pfe-jump-links-panel.scss";
  }

  static get events() {
    return {
      change: `${this.tag}:change`,
      activeNavItem: `${this.tag}:active-navItem`
    };
  }

  static get PfeType() {
    return PFElement.PfeTypes.Content;
  }

  static get properties() {
    return {
      offset: {
        title: "Offset",
        type: Number
      },
      scrolltarget: {
        title: "Scroll target",
        type: String
      }
    };
  }

  // -- This getter looks for the CSS variable `--pfe-jump-links--offset` or `--pfe-navigation--Height--actual`
  get offsetValue() {
    if (this.offset) return this.offset;

    let cssvariable =
      this.cssVariable(`pfe-jump-links--offset`) || this.cssVariable("--pfe-navigation--Height--actual");
    // If a variable is found
    if (cssvariable) {
      // If it's not a pixel value or a raw number value, throw a warning (returns with default of 200 in this case)
      if (cssvariable.slice(-2) !== "px" && cssvariable != Number.parseInt(cssvariable, 10)) {
        this.warn(
          `Value "${cssvariable}" contains a unit (other than px) and is not supported for --${this.tag}--offset.`
        );
      } else {
        // If the value is a pixel or a number value, return it
        return Number.parseInt(cssvariable, 10);
      }
    }

    // If no variables were found, default to 200
    return 200;
  }

  constructor() {
    super(PfeJumpLinksPanel, { type: PfeJumpLinksPanel.PfeType });
    this._init = this._init.bind(this);
    this._slot = this.shadowRoot.querySelector("slot");
    this._slot.addEventListener("slotchange", this._init);
    this._scrollCallback = this._scrollCallback.bind(this);
    this._handleResize = this._handleResize.bind(this);
    this._makeSpacers = this._makeSpacers.bind(this);
    this._mutationCallback = this._mutationCallback.bind(this);
    this._observer = new MutationObserver(this._mutationCallback);
    this.currentActive = null;
    this._isValidMarkup = this._isValidMarkup.bind(this);
    window.addEventListener("resize", this._handleResize);
  }

  connectedCallback() {
    super.connectedCallback();
    this._makeSpacers();
    this._isValidMarkup();
    this.nav = this._getNav();
    this._init();
    if (this.nav && this.nav.autobuild) {
      this.nav._rebuildNav();
    }

    this._observer.observe(this, pfeJumpLinksPanelObserverConfig);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this._observer.disconnect();
    window.removeEventListener("scroll");
    this._slot.removeEventListener("slotchange", this._init);
    window.removeEventListener("resize", this._handleResize);
  }

  _isValidMarkup() {
    if (this.childElementCount === 1) {
      this.warn(
        "pfe-jump-links-panel must contain more than one child element. Having a top-level 'wrapper' will prevent appropriate styles from being applied."
      );
    }
  }

  _makeSpacers() {
    let sections = this.querySelectorAll(".pfe-jump-links-panel__section");
    if (!sections) {
      return;
    }
    sections.forEach(section => {
      let parentDiv = section.parentNode;
      let html = document.createElement("div");
      parentDiv.insertBefore(html, section);
      let spacer = section.previousElementSibling;
      spacer.classList.add("pfe-jump-links__section--spacer");
      spacer.id = section.id;
      section.removeAttribute("id");
    });
  }

  _init() {
    window.addEventListener("scroll", this._scrollCallback);
    // this.scrollTarget = this.scrolltarget;
    this.JumpLinksNav = document.querySelector(`#${this.scrolltarget}`);
    this.sections = this.querySelectorAll(".pfe-jump-links-panel__section");
    this.menu_links;
    if (this.JumpLinksNav) {
      this.menu_links = this.JumpLinksNav.shadowRoot.querySelectorAll("a");
    }
  }

  _handleResize() {
    this.nav._reportHeight();
  }

  _getNav() {
    return document.querySelector(`pfe-jump-links-nav#${this.scrolltarget}`);
  }

  _makeActive(link) {
    if (this.menu_links[link]) {
      // Check if this is a subnav or has subsections
      if (this.menu_links[link].classList.contains("sub-section")) {
        this.menu_links[link].setAttribute("active", "");
        this.menu_links[link].parentNode.parentNode.parentNode.setAttribute("active", "");
        this.menu_links[link].parentNode.parentNode.parentNode.classList.add("expand");
      } else if (this.menu_links[link].classList.contains("has-sub-section")) {
        this.menu_links[link].setAttribute("active", "");
        this.menu_links[link].parentNode.setAttribute("active", "");
        this.menu_links[link].parentNode.classList.add("expand");
      } else {
        this.menu_links[link].setAttribute("active", "");
        this.menu_links[link].parentNode.setAttribute("active", "");
      }

      let activeLink = this.JumpLinksNav.querySelector("[active]");
      this.emitEvent(PfeJumpLinksPanel.events.activeNavItem, {
        detail: {
          activeNavItem: activeLink
        }
      });
    }
  }

  _removeActive(link) {
    if (this.menu_links[link]) {
      if (this.menu_links[link].classList.contains("sub-section")) {
        this.menu_links[link].parentNode.parentNode.parentNode.classList.remove("expand");
      }
      this.menu_links[link].removeAttribute("active");
      this.menu_links[link].parentNode.removeAttribute("active");
    }
  }

  _removeAllActive() {
    if (!Object.keys) {
      Object.keys = function(obj) {
        if (obj !== Object(obj)) throw new TypeError("Object.keys called on a non-object");
        var k = [],
          p;
        for (p in obj) if (Object.prototype.hasOwnProperty.call(obj, p)) k.push(p);
        return k;
      };
      Object.keys.forEach = Array.forEach;
    }
    [...Array(this.sections.length).keys()].forEach(link => {
      this._removeActive(link);
    });
  }

  _mutationCallback() {
    if (window.ShadyCSS) {
      this._observer.disconnect();
    }

    //If we didn't get nav in the constructor, grab it now
    if (!this.nav) {
      this.nav = document.querySelector(`pfe-jump-links-nav#${this.scrolltarget}`);
    }
    //If we want the nav to be built automatically, re-init panel and rebuild nav
    if (this.autobuild) {
      this._init();
      this.emitEvent(PfeJumpLinksPanel.events.change);
      this.nav._rebuildNav();
    }

    if (window.ShadyCSS) {
      this._observer.observe(this, pfeJumpLinksPanelObserverConfig);
    }
  }

  _scrollCallback() {
    let sections;
    // let menu_links;
    //Check sections to make sure we have them (if not, get them)
    if (!this.sections || typeof this.sections === "undefined") {
      this.sections = this.querySelectorAll(`.${this.tag}__section`);
    } else {
      sections = this.sections;
    }
    //Check list of links to make sure we have them (if not, get them)
    if (!this.menu_links) {
      this.menu_links = this.JumpLinksNav.shadowRoot.querySelectorAll("a");
    }

    // Make an array from the node list
    const sectionArr = [...sections];
    // Get all the sections that match this point in the scroll
    const matches = sectionArr.filter(section => window.scrollY >= section.offsetTop - this.offsetValue).reverse();

    //Identify the last one queried as the current section
    const current = sectionArr.indexOf(matches[0]);

    // If that section isn't already active,
    // remove active from the other links and make it active
    if (current !== this.currentActive) {
      this._observer.disconnect();
      this._removeAllActive();
      this.currentActive = current;
      this._makeActive(current);
      this._observer.observe(this, pfeJumpLinksNavObserverConfig);
    }
  }
}

PFElement.create(PfeJumpLinks);
PFElement.create(PfeJumpLinksNav);
PFElement.create(PfeJumpLinksPanel);

export default PfeJumpLinks;
