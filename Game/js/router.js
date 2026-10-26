
/* =========================================================
 * Meta Puzzle — Router
 * File: js/router.js
 * Supports:
 *   - Local Python HTTP server
 *   - GitHub Pages project sites
 *   - Client-side navigation
 *   - Browser back / forward
 * ========================================================= */

const Router = (() => {
  const TOTAL_STAGES = 13;

  const ROUTES = {
    home: "/",
    stage(number) {
      return `/stage/${String(number).padStart(2, "0")}/`;
    },
    notFound: "/not-found/"
  };

  let basePath = "/";
  let currentRoute = null;

  // -------------------------------------------------------
  // Path helpers
  // -------------------------------------------------------

  function normalizePath(path) {
    if (!path || path === "/") {
      return "/";
    }

    let clean = String(path).replace(/\/+/g, "/");

    if (!clean.startsWith("/")) {
      clean = `/${clean}`;
    }

    // Do not append a slash to a filename such as index.html.
    if (clean.endsWith("/") || /\.[^/]+$/.test(clean)) {
      return clean;
    }

    return `${clean}/`;
  }

  function configure(options = {}) {
    if (options.basePath) {
      basePath = normalizePath(options.basePath);
      if (!basePath.endsWith("/")) {
        basePath += "/";
      }
      return basePath;
    }

    const hostname = window.location.hostname;
    const pathname = window.location.pathname;

    // GitHub Pages project sites:
    // https://username.github.io/repository/
    //
    // Custom domains and localhost use "/".
    if (
      hostname.endsWith(".github.io") &&
      !/^\/?$/.test(pathname)
    ) {
      const segments = pathname.split("/").filter(Boolean);

      // When the page is opened under a repository directory,
      // the first path segment is the repository name.
      basePath = segments.length > 0
        ? `/${segments[0]}/`
        : "/";
    } else {
      basePath = "/";
    }

    return basePath;
  }

  /**
   * Turn an app-relative route into a browser pathname.
   */
  function toUrl(route) {
    const normalized = normalizePath(route);

    if (basePath === "/") {
      return normalized;
    }

    if (normalized === "/") {
      return basePath;
    }

    return `${basePath}${normalized.replace(/^\/+/, "")}`;
  }

  /**
   * Remove the app's base path from a browser pathname.
   */
  function fromUrl(pathname = window.location.pathname) {
    const path = normalizePath(pathname);

    if (basePath === "/") {
      return path;
    }

    if (path === basePath.slice(0, -1)) {
      return "/";
    }

    if (!path.startsWith(basePath)) {
      return null;
    }

    const relative = path.slice(basePath.length);
    return normalizePath(relative);
  }

  // -------------------------------------------------------
  // Route parsing
  // -------------------------------------------------------

  function parse(pathname = window.location.pathname) {
    const routePath = fromUrl(pathname);

    if (routePath === null) {
      return {
        type: "not-found",
        path: pathname,
        stage: null
      };
    }

    if (
      routePath === "/" ||
      routePath === "/index.html" ||
      routePath === "/index.html/"
    ) {
      return {
        type: "home",
        path: "/",
        stage: null
      };
    }

    const match = routePath.match(/^\/stage\/(\d{1,2})\/?$/);

    if (match) {
      const stageNumber = Number(match[1]);

      if (
        Number.isInteger(stageNumber) &&
        stageNumber >= 1 &&
        stageNumber <= TOTAL_STAGES
      ) {
        return {
          type: "stage",
          path: ROUTES.stage(stageNumber),
          stage: stageNumber
        };
      }
    }

    if (
      routePath === ROUTES.notFound ||
      routePath === "/404.html"
    ) {
      return {
        type: "not-found",
        path: routePath,
        stage: null
      };
    }

    return {
      type: "not-found",
      path: routePath,
      stage: null
    };
  }

  function resolve() {
    currentRoute = parse();
    return currentRoute;
  }

  function getCurrentRoute() {
    return currentRoute;
  }

  // -------------------------------------------------------
  // Client-side navigation
  // -------------------------------------------------------

  

function navigate(route, options = {}) {
  const target = toUrl(route);
  const url = new URL(target, window.location.origin);

  if (options.query && typeof options.query === "object") {
    for (const [key, value] of Object.entries(options.query)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  if (options.hash) {
    url.hash = options.hash;
  }

  if (options.replace) {
    window.history.replaceState({}, "", url.href);
  } else {
    window.history.pushState({}, "", url.href);
  }

  window.dispatchEvent(new PopStateEvent("popstate"));
}



  function stageUrl(number) {
    if (
      !Number.isInteger(number) ||
      number < 1 ||
      number > TOTAL_STAGES
    ) {
      throw new RangeError(
        `Stage number must be between 1 and ${TOTAL_STAGES}.`
      );
    }

    return toUrl(ROUTES.stage(number));
  }

  function getBasePath() {
    return basePath;
  }

  return {
    ROUTES,
    configure,
    normalizePath,
    toUrl,
    fromUrl,
    parse,
    resolve,
    navigate,
    stageUrl,
    getCurrentRoute,
    getBasePath
  };
})();

export default Router;

