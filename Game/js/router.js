
// =========================================================
// Meta Puzzle — Router
// File: js/router.js
// =========================================================

const Router = (() => {
  const ROUTES = {
    home: "/",
    stage: (number) => `/stage/${String(number).padStart(2, "0")}/`,
    notFound: "/not-found/"
  };

  let basePath = "/";
  let currentRoute = null;

  /**
   * Normalize a path so comparisons are consistent.
   */
  function normalizePath(path) {
    if (!path || path === "/") {
      return "/";
    }

    const cleanPath = path.replace(/\/+/g, "/");

    return cleanPath.endsWith("/")
      ? cleanPath
      : `${cleanPath}/`;
  }

  /**
   * Determine the GitHub Pages project base path.
   *
   * Examples:
   *   https://example.com/          -> /
   *   https://user.github.io/repo/  -> /repo/
   *
   * Pass an explicit base path if the repository name cannot
   * be inferred safely from the current URL.
   */
  function configure(options = {}) {
    if (options.basePath) {
      basePath = normalizePath(options.basePath);
      return basePath;
    }

    const path = normalizePath(window.location.pathname);

    // GitHub Pages custom domains and user sites normally use "/".
    // Project sites use "/repository-name/".
    const hostname = window.location.hostname;
    const isGitHubUserSite =
      hostname.endsWith(".github.io") &&
      hostname.split(".")[0] !== "github";

    if (isGitHubUserSite) {
      const firstSegment = path.split("/").filter(Boolean)[0];

      // The app's root is expected to be served from the repository
      // root. The first segment is treated as the repository path.
      basePath = firstSegment ? `/${firstSegment}/` : "/";
    } else {
      basePath = "/";
    }

    return basePath;
  }

  /**
   * Convert an app-relative route into a real URL path.
   */
  function toUrl(route) {
    const normalizedRoute = normalizePath(route);

    if (normalizedRoute === "/") {
      return basePath;
    }

    return `${basePath}${normalizedRoute.replace(/^\/+/, "")}`;
  }

  /**
   * Convert a browser path into an app-relative route.
   * Returns null if the path is outside this app.
   */
  function fromUrl(pathname = window.location.pathname) {
    const path = normalizePath(pathname);

    if (basePath !== "/" && !path.startsWith(basePath)) {
      return null;
    }

    const relativePath =
      basePath === "/"
        ? path
        : normalizePath(path.slice(basePath.length));

    return relativePath;
  }

  /**
   * Parse the current URL into a route descriptor.
   */
  function parse(pathname = window.location.pathname) {
    const routePath = fromUrl(pathname);

    if (routePath === null) {
      return {
        type: "not-found",
        path: pathname,
        stage: null
      };
    }

    if (routePath === "/" || routePath === "/index.html/") {
      return {
        type: "home",
        path: "/",
        stage: null
      };
    }

    const stageMatch = routePath.match(/^\/stage\/(\d{2})\/$/);

    if (stageMatch) {
      const stageNumber = Number(stageMatch[1]);

      if (stageNumber >= 1 && stageNumber <= 13) {
        return {
          type: "stage",
          path: routePath,
          stage: stageNumber
        };
      }
    }

    if (routePath === ROUTES.notFound) {
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

  /**
   * Navigate to another app route.
   * Full-page navigation is intentional for the static-site version:
   * it keeps refreshes and direct links predictable.
   */
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
      window.location.replace(url.href);
    } else {
      window.location.assign(url.href);
    }
  }

  /**
   * Return a route for a numbered stage.
   */
  function stageUrl(number) {
    if (!Number.isInteger(number) || number < 1 || number > 13) {
      throw new RangeError("Stage number must be between 1 and 13.");
    }

    return toUrl(ROUTES.stage(number));
  }

  /**
   * Read the current route and cache it.
   */
  function resolve() {
    currentRoute = parse();
    return currentRoute;
  }

  function getCurrentRoute() {
    return currentRoute;
  }

  function getBasePath() {
    return basePath;
  }

  return {
    configure,
    normalizePath,
    toUrl,
    fromUrl,
    parse,
    navigate,
    stageUrl,
    resolve,
    getCurrentRoute,
    getBasePath,
    ROUTES
  };
})();

export default Router;
