const usernameInput = document.getElementById("username-input");
const searchButton = document.getElementById("search-button");
const loadingMessage = document.getElementById("loading-message");
const errorMessage = document.getElementById("error-message");
const dashboard = document.getElementById("dashboard");

const API_URL = "https://api.github.com/users/";

searchButton.addEventListener("click", searchUser);

usernameInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    searchUser();
  }
});

async function searchUser() {
  const username = usernameInput.value.trim();

  if (username === "") {
    showError();
    return;
  }

  showLoading();

  try {
    const user = await getUserData(username);
    const repos = await getRepositories(username);

    const analytics = calculateAnalytics(repos);

    displayUser(user);
    displayStats(user, analytics);
    displayLanguages(analytics.languageCounts);
    displayRepositories(repos);

    dashboard.classList.remove("hidden");
  } catch (error) {
    console.log("Something went wrong:", error);
    dashboard.classList.add("hidden");

    if (error.status === 404) {
      showError("User not found. Please check the username and try again.");
    }
    else{
      showError();
    }
  }

  hideLoading();
}

async function getUserData(username) {
  const response = await fetch(API_URL + username);

  if (!response.ok) {
    const error = new Error("User request failed. Status: " + response.status);
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  return data;
}

async function getRepositories(username) {
  const response = await fetch(API_URL + username + "/repos?per_page=100&sort=updated");

  if (!response.ok) {
    const error = new Error("Repo request failed. Status: " + response.status);
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  return data; 
}

function calculateAnalytics(repos) {
  let totalStars = 0;
  let totalForks = 0;
  const languageCounts = {};

  repos.forEach(function (repo) {
    totalStars = totalStars + repo.stargazers_count;
    totalForks = totalForks + repo.forks_count;

    if (repo.language !== null) {
      if (languageCounts[repo.language] === undefined) {
        languageCounts[repo.language] = 1;
      } else {
        languageCounts[repo.language] = languageCounts[repo.language] + 1;
      }
    }
  });

  return {
    totalRepos: repos.length,
    totalStars: totalStars,
    totalForks: totalForks,
    languageCounts: languageCounts
  };
}

function displayUser(user) {
  document.getElementById("avatar").src = user.avatar_url;
  document.getElementById("name").textContent = user.name || user.login;
  document.getElementById("username").textContent = "@" + user.login;
  

  
}

function displayStats(user, analytics) {
  document.getElementById("stat-repos").textContent = analytics.totalRepos;
  document.getElementById("stat-stars").textContent = analytics.totalStars;
  document.getElementById("stat-forks").textContent = analytics.totalForks;
  document.getElementById("stat-followers").textContent = user.followers;
  document.getElementById("stat-following").textContent = user.following;
}

function displayLanguages(languageCounts) {
  const languageList = document.getElementById("language-list");
  languageList.innerHTML = "";

  const entries = Object.entries(languageCounts);

  if (entries.length === 0) {
    languageList.textContent = "No repository data available.";
    return;
  }

  entries.sort(function (a, b) {
    return b[1] - a[1];
  });

  const total = entries.reduce(function (sum, entry) {
    return sum + entry[1];
  }, 0);

  for (let i = 0; i < entries.length; i++) {
    const languageName = entries[i][0];
    const count = entries[i][1];
    const percent = Math.round((count / total) * 100);

    const row = document.createElement("div");
    row.className = "language-row";

    const name = document.createElement("span");
    name.className = "language-name";
    name.textContent = languageName;

    const barBackground = document.createElement("div");
    barBackground.className = "bar-background";

    const barFill = document.createElement("div");
    barFill.className = "bar-fill";
    barFill.style.width = percent + "%";
    barBackground.appendChild(barFill);

    const countText = document.createElement("span");
    countText.className = "language-count";
    countText.textContent = count + " repos (" + percent + "%)";

    row.appendChild(name);
    row.appendChild(barBackground);
    row.appendChild(countText);
    languageList.appendChild(row);
  }
}

function displayRepositories(repos) {
  const repoList = document.getElementById("repo-list");
  repoList.innerHTML = "";

  if (repos.length === 0) {
    repoList.textContent = "No repository data available.";
    return;
  }

  repos.forEach(function (repo) {
    const card = document.createElement("div");
    card.className = "repo-card";

    const title = document.createElement("h3");
    const link = document.createElement("a");
    link.href = repo.html_url;
    link.target = "_blank";
    link.textContent = repo.name;
    title.appendChild(link);

    const description = document.createElement("p");
    description.textContent = repo.description || "No description.";

    const details = document.createElement("p");
    details.textContent =
      "Stars: " + repo.stargazers_count +
      " | Forks: " + repo.forks_count +
      " | Language: " + (repo.language || "Not specified");

    card.appendChild(title);
    card.appendChild(description);
    card.appendChild(details);
    repoList.appendChild(card);
  });
}

function showLoading() {
  loadingMessage.classList.remove("hidden");
  errorMessage.classList.add("hidden");
  dashboard.classList.add("hidden");
}

function hideLoading() {
  loadingMessage.classList.add("hidden");
}

function showError(message) {
  if (message) {
    errorMessage.textContent = message;
  } else {
    errorMessage.innerHTML =
      "User not found.<br>Please check the username and try again.";
  }
  errorMessage.classList.remove("hidden");
}
