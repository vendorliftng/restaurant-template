const restaurantForm = document.querySelector("#restaurant-form");
const restaurantDetailsKey = "vendorLiftRestaurantDetails";
// Load saved restaurant details from sessionStorage and populate the form fields
const savedDetails = sessionStorage.getItem(restaurantDetailsKey);

if (savedDetails) {
  const details = JSON.parse(savedDetails);

  for (const [name, value] of Object.entries(details)) {
    const field = restaurantForm.elements.namedItem(name);
    if (field) {
      field.value = value;
    }
  }
}

restaurantForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const details = Object.fromEntries(new FormData(restaurantForm).entries());
  sessionStorage.setItem(restaurantDetailsKey, JSON.stringify(details));
  window.location.href = "menu.html";
});
