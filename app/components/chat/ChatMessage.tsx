import { cn } from "@/lib/utils";
import { Icon } from "@/app/components/ui";
import { useState, useRef, KeyboardEvent } from "react";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  userName?: string;
}

export function ChatMessage({
  role,
  content,
  userName,
}: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex gap-4 w-full group",
        isUser && "flex-row-reverse"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "h-8 w-8 shrink-0 rounded-full flex items-center justify-center mt-1 shadow-sm",
          isUser ? "bg-teal-accent/20" : "bg-teal-accent text-white"
        )}
      >
        {isUser ? (
          <Icon name="person" className="text-teal-accent" size="sm" />
        ) : (
          <Icon name="smart_toy" size="sm" />
        )}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          "flex flex-col gap-1 max-w-[90%]",
          isUser && "items-end"
        )}
      >
        <div className="font-medium text-sm text-gray-600">
{isUser ? (userName || "Tú") : "EcoDialoga IA"}
        </div>
        <div
          className={cn(
            "px-5 py-3 text-[15px] leading-relaxed text-gray-800 shadow-sm",
            isUser
              ? "bg-pastel-pink rounded-2xl rounded-tr-sm"
              : "bg-pastel-green rounded-2xl rounded-tl-sm"
          )}
        >
          <ReactMarkdown
            components={{
              p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
              strong: ({children}) => <strong className="font-bold">{children}</strong>,
              em: ({children}) => <em className="italic">{children}</em>,
              ol: ({children}) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
              ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
              li: ({children}) => <li className="mb-1">{children}</li>,
              code: ({children}) => <code className="bg-gray-200 bg-opacity-50 px-1 rounded text-sm font-mono">{children}</code>,
              pre: ({children}) => <pre className="bg-gray-200 bg-opacity-30 p-3 rounded mb-2 overflow-x-auto text-sm">{children}</pre>,
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

interface ChatInputProps {
  placeholder?: string;
  onSend?: (message: string) => void;
}

export function ChatInput({
  placeholder = "Escribe tu mensaje aquí...",
  onSend,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (message.trim() && onSend) {
      onSend(message);
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full flex justify-center pb-8 pt-4 px-4 bg-cream-bg/90 backdrop-blur-sm z-20">
      <div className="w-full max-w-3xl relative">
        <div className="bg-white rounded-[2rem] shadow-lg border border-gray-200 flex flex-col overflow-hidden transition-all focus-within:shadow-xl focus-within:border-teal-accent/30">
          <div className="flex items-end gap-2 p-3 pl-5">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full max-h-[150px] min-h-[24px] py-3 bg-transparent border-none focus:ring-0 text-gray-800 placeholder-gray-400 outline-none resize-none overflow-y-auto"
              placeholder={placeholder}
              rows={1}
              style={{ fieldSizing: "content" } as React.CSSProperties}
            />
            <div className="flex items-center gap-2 pb-2">
              <button 
                onClick={handleSend}
                disabled={!message.trim()}
                className={cn(
                  "h-10 w-10 flex items-center justify-center rounded-full shadow-sm transition-all ml-1",
                  message.trim() 
                    ? "bg-teal-accent text-white hover:bg-teal-accent/90 hover:scale-105 active:scale-95" 
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                )}
              >
                <Icon name="send" size="md" />
              </button>
            </div>
          </div>
        </div>
        <p className="text-center text-[11px] text-gray-500 mt-3">
Recuerda que la docente hace seguimiento de todo el proceso.
        </p>
      </div>
    </div>
  );
}
