import "./style.css";

let recognition = null;
let typingTimer = null;

const menu = [
  { name: "Chicken Biryani", price: 220 },
  { name: "Parotta & Curry", price: 180 },
  { name: "Chicken Noodles", price: 200 },
  { name: "Chicken Fried Rice", price: 180 },
  { name: "Fried Chicken", price: 250 },
  { name: "Fish Fry", price: 220 },
  { name: "Chicken 65", price: 190 },
  { name: "Pepper Chicken", price: 240 },
  { name: "Idly", price: 40 },
  { name: "Dosa", price: 60 },
  { name: "Poori", price: 70 },
  { name: "Masala Dosa", price: 90 }
];

let step = 0;

let order = {
  customer_name: "",
  phone_number: "",
  order_type: "",
  delivery_address: "",
  ordered_items: "",
  quantity: 1,
  estimated_time: "",
  status: "Pending"
};

window.startOrder = async function () {

  step = 1;

  order = {
    customer_name: "",
    phone_number: "",
    order_type: "",
    delivery_address: "",
    ordered_items: "",
    quantity: 1,
    estimated_time: "",
    status: "Pending"
  };

  document.getElementById("chatBox").innerHTML = "";
  updateProgress(1);
  setAgentStatus("Step 1 of 6 — your name");

 await botSay("Welcome to Banana Leaf Restaurant 🍃", 200);
 await botSay("We're delighted to serve you today.");
 await botSay("May I know your name?");

  startVoice();
};

function setAgentStatus(text) {
  const status = document.getElementById("agent-status");
  if (status) status.textContent = text;
}

function updateProgress(stepNum) {
  const fill = document.getElementById("progressFill");
  if (fill) fill.style.width = Math.min(100, (stepNum / 6) * 100) + "%";
}

/* ---------- delivery / pickup time estimate ---------- */
function estimateTime(type, address) {
  if (type === "Pickup") {
    const min = 12 + Math.floor(Math.random() * 4);   // 12-15
    const max = min + 8;                                // +8 mins window
    return `${min}-${max} mins (ready for pickup)`;
  }

  // Delivery: base time + a small variation based on address length
  // (longer / farther-sounding address -> slightly longer estimate)
  const lengthFactor = Math.min(15, Math.floor((address || "").length / 6));
  const min = 28 + lengthFactor + Math.floor(Math.random() * 5);
  const max = min + 12;
  return `${min}-${max} mins`;
}

/* ---------- typing indicator + delayed bot reply ---------- */
function showTyping() {
  const chatBox = document.getElementById("chatBox");
  const t = document.createElement("div");
  t.className = "msg msg-bot";
  t.id = "typingBubble";
  t.innerHTML = `
    <span class="msg-avatar">🍃</span>
    <span class="msg-text typing-dots"><span></span><span></span><span></span></span>
  `;
  chatBox.appendChild(t);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function hideTyping() {
  const t = document.getElementById("typingBubble");
  if (t) t.remove();
}

function botSay(text, delay = 550, quickReplies = null) {
  return new Promise((resolve) => {
    showTyping();
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      hideTyping();
      appendMessage(`🤖 ${text}`);
      if (quickReplies) addQuickReplies(quickReplies);
      resolve();
    }, delay);
  });
}

/* ---------- quick reply chips ---------- */
function addQuickReplies(options) {
  const chatBox = document.getElementById("chatBox");
  const wrap = document.createElement("div");
  wrap.className = "quick-replies";

  options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.className = "chip-btn";
    btn.type = "button";
    btn.textContent = opt;
    btn.onclick = () => {
      document.getElementById("userInput").value = opt;
      wrap.querySelectorAll("button").forEach((b) => (b.disabled = true));
      wrap.classList.add("used");
      sendMessage();
    };
    wrap.appendChild(btn);
  });

  chatBox.appendChild(wrap);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function appendMessage(message) {

  const chatBox = document.getElementById("chatBox");

  const raw = message.trim();

  let type = "bot";
  let text = raw;

  if (raw.startsWith("👤")) {
    type = "user";
    text = raw.replace("👤", "").trim();
  } else if (raw.startsWith("🤖")) {
    type = "bot";
    text = raw.replace("🤖", "").trim();
  } else if (
    raw.startsWith("🎤") ||
    raw.startsWith("✅") ||
    raw.startsWith("❌")
  ) {
    type = "system";
    text = raw;
  }

  const bubble = document.createElement("div");

  if (type === "system") {
    bubble.className = "msg msg-system";
    bubble.textContent = text;
  } else {
    bubble.className = "msg " + (type === "user" ? "msg-user" : "msg-bot");
    bubble.innerHTML = `
      <span class="msg-avatar">${type === "user" ? "🧑" : "🍃"}</span>
      <span class="msg-text"></span>
    `;
    bubble.querySelector(".msg-text").textContent = text;
  }

  chatBox.appendChild(bubble);

  chatBox.scrollTop = chatBox.scrollHeight;
}

window.sendMessage = function () {

  if (step === 0) {

    appendMessage(
      "🤖 Please click Start AI Order first."
    );

    return;

  }

  const input =
    document.getElementById("userInput");

  const value =
    input.value.trim();

  if (!value) return;

  appendMessage(`👤 ${value}`);

  processMessage(value);

  input.value = "";
};

function processMessage(value) {

  if (step === 1) {

    order.customer_name = value;

    updateProgress(2);
    setAgentStatus("Step 2 of 6 — phone number");
    botSay("Please tell your phone number.");

    return step = 2;

  }

  if (step === 2) {

    order.phone_number = value;

    updateProgress(3);
    setAgentStatus("Step 3 of 6 — pickup or delivery");
    botSay("Pickup or Delivery?", 550, ["Pickup", "Delivery"]);

    return step = 3;

  }

  if (step === 3) {

    const type =
      value.toLowerCase().trim();

    if (
      type === "pickup" ||
      type === "pick up"
    ) {

      order.order_type = "Pickup";
      order.estimated_time = estimateTime("Pickup");

      updateProgress(5);
      setAgentStatus("Step 4 of 6 — your order");

      botSay(`Got it — pickup. Your order will be ready in ${order.estimated_time}.`).then(() => {
        botSay("What would you like to order?", 500, menu.map(m => `${m.name} (₹${m.price})`));
      });

      return step = 5;
    }

    if (type === "delivery") {

      order.order_type = "Delivery";

      updateProgress(4);
      setAgentStatus("Step 4 of 6 — delivery address");
      botSay("Please tell your delivery address.");

      return step = 4;
    }

    botSay("Please say Pickup or Delivery.", 400, ["Pickup", "Delivery"]);

    return;

  }

  if (step === 4) {

    order.delivery_address = value;
    order.estimated_time = estimateTime("Delivery", value);

    updateProgress(5);
    setAgentStatus("Step 5 of 6 — your order");

    botSay(`Thanks! Estimated delivery time to this address: ${order.estimated_time}.`).then(() => {
      botSay("What would you like to order?", 500, menu.map(m => `${m.name} (₹${m.price})`));
    });

    return step = 5;

  }

  if (step === 5) {

    const foundItem =
      menu.find(item =>
        value.toLowerCase().includes(
          item.name.toLowerCase()
        )
      );

    if (!foundItem) {

      botSay(
        "Item not found in menu. Please pick one below.",
        400,
        menu.map(m => `${m.name} (₹${m.price})`)
      );

      return;
    }

    const qtyMatch =
      value.match(/\d+/);

    order.quantity =
      qtyMatch
        ? parseInt(qtyMatch[0])
        : 1;

    order.ordered_items =
      foundItem.name;

    updateProgress(6);
    setAgentStatus("Step 6 of 6 — confirm");

    botSay(
      `Order Summary
Name: ${order.customer_name}
Phone: ${order.phone_number}
Order Type: ${order.order_type}
Address: ${order.delivery_address || "N/A"}
Item: ${order.ordered_items}
Quantity: ${order.quantity}
Estimated Time: ${order.estimated_time}

Please say CONFIRM to place the order, or Cancel to start over.`,
      500,
      ["CONFIRM", "Cancel"]
    );

    return step = 6;

  }

  if (step === 6) {

    const decision = value.toLowerCase().trim();

    if (decision === "cancel") {

      botSay("Order cancelled. Tap Start AI Order to begin again.");
      updateProgress(0);
      setAgentStatus("Order cancelled");
      step = 0;
      return;
    }

    if (decision !== "confirm") {

      botSay("Please say CONFIRM or Cancel.", 400, ["CONFIRM", "Cancel"]);

      return;
    }

    saveOrder();
  }
}

async function saveOrder() {

  setAgentStatus("Placing your order...");

   await botSay(
    "🍃 We're placing your order now. This will only take a few seconds. Please keep this window open."
  );

  const payload = {

    customer_name:
      order.customer_name,

    phone_number:
      order.phone_number,

    ordered_items:
      order.ordered_items,

    quantity:
      order.quantity,

    order_type:
      order.order_type,

    delivery_address:
      order.delivery_address,

    estimated_time:
      order.estimated_time,

    status:
      order.status

  };

  try {

    const response =
      await fetch(
        "https://bwtn8n.blackwinstech.com/webhook/23c087ff-018c-4cb2-9614-7dad92ee0e3f",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body:
            JSON.stringify(payload)
        }
      );

    if (response.ok) {

      appendMessage(
        "✅ Order Placed Successfully!"
      );

      await botSay(
        order.order_type === "Pickup"
          ? `Your order will be ready for pickup in ${order.estimated_time}. See you soon! 🍃`
          : `Your order is on its way! Estimated delivery time: ${order.estimated_time}. 🍃`
      );

      updateProgress(100);
      setAgentStatus("Order placed 🎉 — tap Start AI Order to order again");

      if (recognition) {
        recognition.stop();
      }

      step = 0;

    } else {

      appendMessage(
        "❌ Failed to place order."
      );

      setAgentStatus("Something went wrong — try again");
    }

  } catch (error) {

    console.error(error);

    appendMessage(
      "❌ Error connecting to server."
    );

    setAgentStatus("Connection error — try again");

  }
}

window.startVoice = function () {

  if (!("webkitSpeechRecognition" in window)) {
    appendMessage("❌ Voice recognition is not supported in this browser.");
    return;
  }

  if (recognition) {
    recognition.stop();
  }

  recognition =
    new webkitSpeechRecognition();

  recognition.lang = "en-IN";
  recognition.continuous = true;
  recognition.interimResults = false;

  recognition.start();

  appendMessage(
    "🎤 Voice Assistant Started"
  );

  const micBtn = document.getElementById("micBtn");

  recognition.onstart = function () {
    if (micBtn) micBtn.classList.add("listening");
    setAgentStatus("Listening...");
  };

  recognition.onresult =
    function (event) {

      const transcript =
        event.results[
          event.results.length - 1
        ][0].transcript;

      document.getElementById(
        "userInput"
      ).value = transcript;

      sendMessage();
    };

  recognition.onerror =
    function (event) {

      console.log(
        "Voice Error:",
        event.error
      );
    };

  recognition.onend = function () {
    if (micBtn) micBtn.classList.remove("listening");
  };

};