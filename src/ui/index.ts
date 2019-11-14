import "./ui.css";
import MessageType from "../messages/MessageType";

const setStorageItem = (key: string, value: any) => {
  parent.postMessage(
    {
      pluginMessage: {
        type: MessageType.SetLocalStorageItem,
        key,
        value
      }
    },
    "*"
  );
};

document
  .querySelectorAll('input[type="checkbox')
  .forEach((el: HTMLInputElement) => {
    el.onchange = (e: Event) => {
      setStorageItem(el.id, el.checked);
    };
  });

document.getElementById("file").onchange = e => {
  const btn = document.getElementById("apply");
  btn.removeAttribute("disabled");
};

document.getElementById("apply").onclick = () => {
  let msg = {
    type: MessageType.ImportStyles
  };
  document
    .querySelectorAll('input[type="checkbox')
    .forEach((el: HTMLInputElement) => {
      msg[el.id] = el.checked;
    });
  const input = document.getElementById("file") as HTMLInputElement;
  const file = input.files[0];
  var reader = new FileReader();
  reader.onloadend = e => {
    const fileContent = e.target.result;
    parent.postMessage(
      {
        pluginMessage: {
          ...msg,
          fileContent
        }
      },
      "*"
    );
  };
  reader.readAsText(file);
};

window.onmessage = event => {
  const msg = event.data.pluginMessage;
  switch (msg.type) {
    case MessageType.InitializeUI:
      document
        .querySelectorAll('input[type="checkbox')
        .forEach((el: HTMLInputElement) => {
          if (msg[el.id] && msg[el.id] === true) {
            el.checked = true;
          }
        });
      break;
  }
};
