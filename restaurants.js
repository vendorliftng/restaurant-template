const list = document.querySelector("[data-restaurant-list]");
const search = document.querySelector("#restaurant-search");
const money = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });

function getRestaurants() {
  try {
    const data = JSON.parse(localStorage.getItem("vendorLiftRestaurants") || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function renderRestaurants() {
  const query = search.value.trim().toLowerCase();
  const restaurants = getRestaurants().filter((restaurant) => {
    const details = restaurant.details || {};
    return `${details.resturantName || ""} ${details.resturantLocation || ""} ${details.resturantCuisineType || ""}`.toLowerCase().includes(query);
  });
  list.replaceChildren();
  if (!restaurants.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state restaurant-empty";
    empty.textContent = query ? "No restaurants match your search." : "No restaurant pages yet. Restaurant menus will appear here when owners publish their dishes.";
    list.append(empty);
    return;
  }

  for (const restaurant of restaurants) {
    const details = restaurant.details || {};
    const card = document.createElement("article");
    card.className = "restaurant-directory-card";
    const icon = document.createElement("span");
    icon.className = "directory-avatar";
    icon.textContent = (details.resturantName || "R").trim().charAt(0).toUpperCase();
    const content = document.createElement("div");
    content.className = "directory-card-copy";
    const title = document.createElement("h2");
    const titleLink = document.createElement("a");
    titleLink.className = "directory-title-link";
    titleLink.href = `restaurant.html?id=${encodeURIComponent(restaurant.id)}`;
    titleLink.textContent = details.resturantName || "Restaurant";
    title.append(titleLink);
    const meta = document.createElement("p");
    meta.className = "post-meta";
    meta.textContent = [details.resturantCuisineType, details.resturantLocation].filter(Boolean).join(" · ") || "Local restaurant";
    const description = document.createElement("p");
    description.textContent = details.resturantDescription || `${(restaurant.dishes || []).length} menu items available.`;
    const link = document.createElement("a");
    link.className = "community-submit directory-link";
    link.href = `restaurant.html?id=${encodeURIComponent(restaurant.id)}`;
    link.textContent = "View menu and order";
    content.append(title, meta, description, link);
    card.append(icon, content);
    list.append(card);
  }
}

search.addEventListener("input", renderRestaurants);
renderRestaurants();
