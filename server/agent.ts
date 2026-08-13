import { MemorySaver, MessagesAnnotation, START, StateGraph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { initDB } from "./db.ts";
import { initTools } from "./tools.ts";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { AIMessage, ToolMessage } from "@langchain/core/messages";

// init database

export const dataBase = initDB("./expense.db");

const t = initTools(dataBase);

// init modal
export const llm = new ChatOpenAI({
  model: "gpt-5-mini",
});

// toolNode
const toolNode = new ToolNode(t);

async function callModal(state: typeof MessagesAnnotation.State) {
  const llmWithTools = llm.bindTools(t);

  const response = await llmWithTools.invoke([
    {
      role: "system",
      content: `You are a helpful expense tracking assistant. Current datetime ${new Date().toISOString()} Call add_expense tool to add the expense to the database. Call the get_expenses tool for get expense with from and to date, Call generate_chart tool only when user need to visualize expenses`,
    },
    ...state.messages,
  ]);
  return {
    messages: [response],
  };
}

// Graph

function shouldCallTools(state: typeof MessagesAnnotation.State) {
  const message = state.messages;
  const lastMessage = message.at(-1) as AIMessage;
  if (lastMessage.tool_calls?.length) {
    return "tools";
  } else {
    return "__end__";
  }
}

function shouldCallModal(state: typeof MessagesAnnotation.State) {
  // change this when chart modal will be implemented
  const messages = state.messages;
  const lastMessage = messages.at(-1) as ToolMessage;

  const parseMessage = JSON.parse(lastMessage.content as string);

  if (parseMessage.type == "chart") {
    return "__end__";
  }
  return "callModal";
}

const graph = new StateGraph(MessagesAnnotation)
  .addNode("callModal", callModal)
  .addNode("tools", toolNode)
  .addEdge(START, "callModal")
  .addConditionalEdges("callModal", shouldCallTools, {
    __end__: "__end__",
    tools: "tools",
  })
  .addConditionalEdges("tools", shouldCallModal, {
    __end__: "__end__",
    callModal: "callModal",
  });

export const agent = graph.compile({ checkpointer: new MemorySaver() });

// async function main() {
//   const response = await agent.stream(
//     {
//       messages: [
//         {
//           role: "human",
//           content: "Can you visualize how much i have spent this year group by month",
//         },
//       ],
//     },
//     { configurable: { thread_id: "1" }, streamMode: "updates" },
//   );

//   for await (const chunk of response) {
//     const [step, content] = Object.entries(chunk)[0];
//     console.log(`step: ${step}`);
//     console.log(`content: ${JSON.stringify(content, null, 2)}`);
//   }
//   console.log(JSON.stringify(response, null, 2));
// }
