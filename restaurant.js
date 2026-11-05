const page = document.querySelector("[data-restaurant-page]");
const restaurantId = new URLSearchParams(window.location.search).get("id");
const profile = page.querySelector("[data-restaurant-profile]");
const menuList = page.querySelector("[data-menu-list]");
const cartItems = page.querySelector("[data-cart-items]");
const cartTotal = page.querySelector("[data-cart-total]");
const placeOrderButton = page.querySelector("[data-place-order]");
const orderMessage = page.querySelector("[data-order-message]");
const socialSection = page.querySelector("[data-restaurant-social]");
const followButton = page.querySelector("[data-follow-button]");
const messageButton = page.querySelector("[data-message-button]");
const enquiryForm = page.querySelector("[data-enquiry-form]");
const enquiryStatus = page.querySelector("[data-enquiry-status]");
const ownerDashboardLink = page.querySelector("[data-owner-dashboard-link]");
const restaurantPosts = page.querySelector("[data-restaurant-posts]");
const money = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });
let cart = new Map();
// Read restaurant data from localStorage
function readRestaurants() {
  try {
    const items = JSON.parse(localStorage.getItem("vendorLiftRestaurants") || "[]");
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

const restaurant = readRestaurants().find((item) => item.id === restaurantId);

function showMissingRestaurant() {
  const empty = document.createElement("p");
  empty.className = "empty-state";
  empty.textContent = "This restaurant page is unavailable. It may have been removed.";
  profile.append(empty);
  menuList.replaceChildren();
  page.querySelector(".order-cart").hidden = true;
  socialSection.hidden = true;
  ownerDashboardLink.hidden = true;
}

function renderProfile() {
  const details = restaurant.details || {};
  const heading = document.createElement("div");
  heading.className = "restaurant-profile-copy";
  const eyebrow = document.createElement("p");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = details.resturantCuisineType || "Restaurant profile";
  const title = document.createElement("h1");
  title.textContent = details.resturantName || "Restaurant";
  const description = document.createElement("p");
  description.textContent = details.resturantDescription || "Explore the menu and place an order.";
  const meta = document.createElement("div");
  meta.className = "restaurant-contact";
  [details.resturantLocation, details.resturantOpeningHours && details.resturantClosingHours ? `${details.resturantOpeningHours}–${details.resturantClosingHours}` : "", details.resturantPhone].filter(Boolean).forEach((value) => {
    const item = document.createElement("span");
    item.textContent = value;
    meta.append(item);
  });
  heading.append(eyebrow, title, description, meta);
  profile.append(heading);
  const user = JSON.parse(sessionStorage.getItem("vendorLiftDemoAuth") || "{}");
  const isOwner = user.role === "restaurant" && user.email && user.email === restaurant.ownerEmail;
  ownerDashboardLink.hidden = !isOwner;
  socialSection.hidden = false;
  if (isOwner) {
    socialSection.hidden = true;
  }
  updateFollowButton();
}

function getFollowerId() {
  const user = JSON.parse(sessionStorage.getItem("vendorLiftDemoAuth") || "{}");
  return user.email || `${user.role || "visitor"}:${user.displayName || "guest"}`;
}

function readFollows() {
  try {
    const follows = JSON.parse(localStorage.getItem("vendorLiftRestaurantFollows") || "[]");
    return Array.isArray(follows) ? follows : [];
  } catch {
    return [];
  }
}

function updateFollowButton() {
  const isFollowing = readFollows().some((follow) => follow.restaurantId === restaurant.id && follow.followerId === getFollowerId());
  followButton.setAttribute("aria-pressed", String(isFollowing));
  followButton.textContent = isFollowing ? "Following ✓" : "Follow restaurant";
}

function renderRestaurantPosts() {
  restaurantPosts.replaceChildren();
  let posts = [];
  try {
    posts = JSON.parse(localStorage.getItem("vendorLiftCommunityPosts") || "[]");
  } catch {
    posts = [];
  }
  const name = restaurant.details?.resturantName || "";
  const ownPosts = posts.filter((post) => post.authorRole !== "customer" &&
    (post.ownerEmail && restaurant.ownerEmail ? post.ownerEmail === restaurant.ownerEmail : post.restaurantName === name));
  ownPosts.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  if (!ownPosts.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "This restaurant has not shared any posts yet.";
    restaurantPosts.append(empty);
    return;
  }
  for (const post of ownPosts) {
    const card = document.createElement("article");
    card.className = "community-card restaurant-post-card";
    const meta = document.createElement("p");
    meta.className = "post-meta";
    const date = Date.parse(post.createdAt);
    meta.textContent = Number.isFinite(date) ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date) : "Recently";
    const caption = document.createElement("p");
    caption.className = "restaurant-post-caption";
    caption.textContent = post.caption || "";
    card.append(meta);
    if (post.photoUrl) {
      const image = document.createElement("img");
      image.className = "restaurant-post-photo";
      image.alt = `Photo shared by ${name}`;
      image.loading = "lazy";
      image.src = post.photoUrl;
      card.append(image);
    }
    card.append(caption);
    const activity = document.createElement("span");
    activity.className = "post-meta";
    activity.textContent = `${Number(post.likes) || 0} likes · ${(post.comments || []).length} comments`;
    card.append(activity);
    restaurantPosts.append(card);
  }
}

followButton.addEventListener("click", () => {
  const follows = readFollows();
  const followerId = getFollowerId();
  const existing = follows.some((follow) => follow.restaurantId === restaurant.id && follow.followerId === followerId);
  const next = existing
    ? follows.filter((follow) => !(follow.restaurantId === restaurant.id && follow.followerId === followerId))
    : [...follows, { restaurantId: restaurant.id, followerId }];
  localStorage.setItem("vendorLiftRestaurantFollows", JSON.stringify(next));
  updateFollowButton();
});

messageButton.addEventListener("click", () => {
  enquiryForm.hidden = !enquiryForm.hidden;
  messageButton.setAttribute("aria-expanded", String(!enquiryForm.hidden));
  if (!enquiryForm.hidden) enquiryForm.elements.message.focus();
});

enquiryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const message = String(new FormData(enquiryForm).get("message") || "").trim();
  if (!message) return;
  try {
    const enquiries = JSON.parse(localStorage.getItem("vendorLiftRestaurantEnquiries") || "[]");
    const user = JSON.parse(sessionStorage.getItem("vendorLiftDemoAuth") || "{}");
    enquiries.unshift({
      id: `enquiry-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      restaurantId: restaurant.id,
      restaurantName: restaurant.details?.resturantName || "Restaurant",
      senderName: user.displayName || "Customer",
      senderEmail: user.email || "",
      message,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem("vendorLiftRestaurantEnquiries", JSON.stringify(enquiries));
    enquiryForm.reset();
    enquiryStatus.textContent = "Enquiry sent. The restaurant can see it in its dashboard in this browser.";
    enquiryStatus.classList.remove("is-error");
  } catch {
    enquiryStatus.textContent = "Your browser could not save this enquiry. Please try again.";
    enquiryStatus.classList.add("is-error");
  }
});

function renderMenu() {
  menuList.replaceChildren();
  if (!restaurant.dishes?.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "This restaurant has not added any meals yet.";
    menuList.append(empty);
    return;
  }
  restaurant.dishes.forEach((dish, index) => {
    const card = document.createElement("article");
    card.className = "menu-item-card";
    if (dish.photo) {
      const image = document.createElement("img");
      image.src = dish.photo;
      image.alt = dish.name;
      image.loading = "lazy";
      card.append(image);
    }
    const content = document.createElement("div");
    content.className = "menu-item-copy";
    const title = document.createElement("h3");
    title.textContent = dish.name;
    const description = document.createElement("p");
    description.textContent = dish.description || dish.ingredients || "Freshly prepared by the restaurant.";
    const price = document.createElement("strong");
    price.className = "menu-item-price";
    price.textContent = money.format(Number(dish.price) || 0);
    const controls = document.createElement("div");
    controls.className = "menu-item-controls";
    const quantity = document.createElement("input");
    quantity.type = "number";
    quantity.min = "1";
    quantity.max = "20";
    quantity.value = "1";
    quantity.setAttribute("aria-label", `Quantity of ${dish.name}`);
    const add = document.createElement("button");
    add.type = "button";
    add.className = "post-action";
    add.dataset.addDish = String(index);
    add.textContent = "Add to order";
    controls.append(quantity, add);
    content.append(title, description, price, controls);
    card.append(content);
    menuList.append(card);
  });
}

function renderCart() {
  cartItems.replaceChildren();
  if (!cart.size) {
    const empty = document.createElement("p");
    empty.className = "cart-empty";
    empty.textContent = "Your order is empty. Add a meal from the menu.";
    cartItems.append(empty);
  }
  let total = 0;
  for (const [index, quantity] of cart) {
    const dish = restaurant.dishes[index];
    const line = document.createElement("p");
    line.className = "cart-line";
    line.textContent = `${dish.name} × ${quantity} — ${money.format((Number(dish.price) || 0) * quantity)}`;
    cartItems.append(line);
    total += (Number(dish.price) || 0) * quantity;
  }
  cartTotal.textContent = money.format(total);
  placeOrderButton.disabled = cart.size === 0;
}

menuList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add-dish]");
  if (!button) return;
  const index = Number(button.dataset.addDish);
  const quantity = Math.min(20, Math.max(1, Number(button.parentElement.querySelector("input").value) || 1));
  cart.set(index, (cart.get(index) || 0) + quantity);
  renderCart();
  orderMessage.textContent = `${restaurant.dishes[index].name} added to your order.`;
  orderMessage.classList.remove("is-error");
});

placeOrderButton.addEventListener("click", () => {
  orderMessage.textContent = "";
  try {
    const orders = JSON.parse(localStorage.getItem("vendorLiftOrders") || "[]");
    const user = JSON.parse(sessionStorage.getItem("vendorLiftDemoAuth") || "{}");
    const items = [...cart].map(([index, quantity]) => ({
      name: restaurant.dishes[index].name,
      quantity,
      unitPrice: Number(restaurant.dishes[index].price) || 0,
    }));
    const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    orders.unshift({
      id: `order-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      restaurantId: restaurant.id,
      restaurantName: restaurant.details.resturantName,
      customerName: user.displayName || "Customer",
      items,
      total,
      createdAt: new Date().toISOString(),
      status: "New",
    });
    localStorage.setItem("vendorLiftOrders", JSON.stringify(orders));
    cart.clear();
    renderCart();
    orderMessage.textContent = "Order placed! This demo saved it in this browser; online payment and restaurant notifications are not connected yet.";
    orderMessage.classList.remove("is-error");
  } catch {
    orderMessage.textContent = "Your browser could not save this order. Please try again.";
    orderMessage.classList.add("is-error");
  }
});

if (restaurant) {
  document.title = `${restaurant.details?.resturantName || "Restaurant"} | VendorLift`;
  renderProfile();
  renderRestaurantPosts();
  renderMenu();
  renderCart();
} else {
  showMissingRestaurant();
}
