/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 shxdes69
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Logger } from "@utils/Logger";
import { ModalContent, ModalRoot, ModalSize, openModal } from "@utils/modal";
import definePlugin, { OptionType } from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { Button, Flex, Forms, React, Switch, TextInput, Toasts } from "@webpack/common";

const TokenModule = findByPropsLazy("getToken");
const logger = new Logger("AnimatedStatus");

interface StatusStep {
    text: string;
    emoji_name?: string;
    emoji_id?: string;
}

function safeParseJSON(jsonString: string, fallback: StatusStep[] = []): StatusStep[] {
    if (!jsonString) return fallback;
    try {
        const parsed = JSON.parse(jsonString);
        return Array.isArray(parsed) ? parsed : fallback;
    } catch (err) {
        logger.error("Failed to parse animation settings:", err);
        return fallback;
    }
}

function TabBar({ activeTab, onChange }: { activeTab: string; onChange: (tab: string) => void; }) {
    return (
        <Flex style={{ marginBottom: "16px" }}>
            {["Messages", "Settings"].map(tab => (
                <div
                    key={tab}
                    onClick={() => onChange(tab)}
                    style={{
                        padding: "8px 16px",
                        cursor: "pointer",
                        borderBottom: `2px solid ${activeTab === tab ? "var(--brand-experiment)" : "transparent"}`,
                        color: activeTab === tab ? "var(--text-normal)" : "var(--text-muted)",
                        fontWeight: activeTab === tab ? 600 : 400,
                        transition: "all 0.2s ease"
                    }}
                >
                    {tab}
                </div>
            ))}
        </Flex>
    );
}

function StatusCard({ status, onDelete }: { status: StatusStep; onDelete: () => void; }) {
    return (
        <div style={{
            background: "var(--background-tertiary)",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "8px",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
            cursor: "pointer",
            position: "relative"
        }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow = "";
            }}
        >
            <Flex direction={Flex.Direction.HORIZONTAL} align={Flex.Align.CENTER} style={{ gap: "12px" }}>
                {status.emoji_name && (
                    <div style={{
                        fontSize: "24px",
                        width: "32px",
                        height: "32px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}>
                        {status.emoji_id ? (
                            <img
                                src={`https://cdn.discordapp.com/emojis/${status.emoji_id}.png`}
                                alt={status.emoji_name}
                                style={{ width: "24px", height: "24px" }}
                            />
                        ) : status.emoji_name}
                    </div>
                )}
                <div style={{ flexGrow: 1, overflow: "hidden" }}>
                    <div style={{
                        color: "var(--text-normal)",
                        fontSize: "14px",
                        fontWeight: 500,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                    }}>
                        {status.text}
                    </div>
                </div>
                <div data-tooltip-text="Delete Status">
                    <Button
                        size={Button.Sizes.SMALL}
                        color={Button.Colors.RED}
                        onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        style={{ padding: "4px 8px", minWidth: "unset" }}
                    >
                        ×
                    </Button>
                </div>
            </Flex>
        </div>
    );
}

function AnimatedStatusSettings() {
    const [activeTab, setActiveTab] = React.useState("Messages");
    const [animation, setAnimation] = React.useState<StatusStep[]>(() => {
        return safeParseJSON(settings.store.animation, [{ text: "Hey there!" }]);
    });
    const [isRunning, setIsRunning] = React.useState(false);
    const [newStatus, setNewStatus] = React.useState("");
    const [timeout, setTimeout] = React.useState(settings.store.timeout);
    const [randomize, setRandomize] = React.useState(settings.store.randomize);
    React.useEffect(() => {
        setIsRunning(statusInterval !== null);
    }, []);
    React.useEffect(() => {
        const checkSettings = () => {
            const newAnimation = safeParseJSON(settings.store.animation, []);
            const newTimeout = settings.store.timeout;
            const newRandomize = settings.store.randomize;

            if (JSON.stringify(newAnimation) !== JSON.stringify(animation)) {
                setAnimation(newAnimation);
            }
            if (newTimeout !== timeout) {
                setTimeout(newTimeout);
            }
            if (newRandomize !== randomize) {
                setRandomize(newRandomize);
            }
        };
        const intervalId = setInterval(checkSettings, 1000);
        return () => clearInterval(intervalId);
    }, [animation, timeout, randomize]);

    const handleTimeoutChange = (value: string) => {
        const num = parseInt(value);
        if (!isNaN(num) && num >= 5) {
            setTimeout(num);
            settings.store.timeout = num;
        }
    };

    const handleRandomizeChange = (value: boolean) => {
        setRandomize(value);
        settings.store.randomize = value;
    };

    const handleAdd = () => {
        if (!newStatus.trim()) return;
        const emojiMatch = newStatus.match(/<:([^:]+):(\d+)>/);
        const newStep: StatusStep = {
            text: newStatus.trim()
        };

        if (emojiMatch) {
            newStep.emoji_name = emojiMatch[1];
            newStep.emoji_id = emojiMatch[2];
        }

        const newAnimation = [...animation, newStep];
        setAnimation(newAnimation);
        settings.store.animation = JSON.stringify(newAnimation);
        setNewStatus("");
    };

    const deleteStep = (index: number) => {
        const newAnimation = animation.filter((_, i) => i !== index);
        setAnimation(newAnimation);
        settings.store.animation = JSON.stringify(newAnimation);
    };

    const toggleAnimation = () => {
        const plugin = window.Vencord?.Plugins?.plugins?.AnimatedStatus as unknown as {
            stop?: () => void;
            startAnimation?: () => void;
        };
        if (!plugin) {
            logger.error("Could not find AnimatedStatus plugin!");
            return;
        }

        if (isRunning) {
            plugin.stop?.();
        } else {
            plugin.startAnimation?.();
        }
        setIsRunning(!isRunning);
    };

    return (
        <div style={{ padding: "16px" }}>
            <TabBar activeTab={activeTab} onChange={setActiveTab} />

            {activeTab === "Messages" ? (
                <>
                    <div style={{
                        background: "var(--background-secondary)",
                        padding: "16px",
                        borderRadius: "8px",
                        marginBottom: "16px"
                    }}>
                        <Forms.FormTitle>Add New Status</Forms.FormTitle>
                        <Flex direction={Flex.Direction.HORIZONTAL} style={{ gap: "8px", marginBottom: "16px" }}>
                            <TextInput
                                placeholder="Type your status message (can include emoji)"
                                value={newStatus}
                                onChange={setNewStatus}
                                style={{ flexGrow: 1 }}
                            />
                            <Button
                                size={Button.Sizes.MEDIUM}
                                onClick={handleAdd}
                                disabled={!newStatus.trim()}
                                color={Button.Colors.BRAND}
                            >
                                Add
                            </Button>
                        </Flex>

                        <Forms.FormText style={{ marginBottom: "16px" }}>
                            To add emojis to your status:
                            <br />
                            • Regular emoji: Use Windows emoji picker (Win + .) or copy from a unicode table
                            <br />
                            • Discord/Nitro emoji: Type \ in Discord chat, select emoji, and copy the ID
                        </Forms.FormText>
                    </div>

                    <div style={{
                        background: "var(--background-secondary)",
                        padding: "16px",
                        borderRadius: "8px"
                    }}>
                        <Flex justify={Flex.Justify.BETWEEN} align={Flex.Align.CENTER} style={{ marginBottom: "16px" }}>
                            <Forms.FormTitle style={{ margin: 0 }}>Your Status Messages</Forms.FormTitle>
                            <Button
                                size={Button.Sizes.SMALL}
                                color={Button.Colors.RED}
                                onClick={() => {
                                    settings.store.animation = "[]";
                                    setAnimation([]);
                                }}
                                style={{ padding: "4px 8px" }}
                            >
                                Clear All
                            </Button>
                        </Flex>

                        {animation.length === 0 ? (
                            <Forms.FormText style={{
                                fontStyle: "italic",
                                color: "var(--text-muted)",
                                textAlign: "center",
                                padding: "32px 16px"
                            }}>
                                No status messages added yet. Add some messages above!
                            </Forms.FormText>
                        ) : (
                            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                                {animation.map((step, i) => (
                                    <StatusCard
                                        key={i}
                                        status={step}
                                        onDelete={() => deleteStep(i)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div style={{
                    background: "var(--background-secondary)",
                    padding: "16px",
                    borderRadius: "8px"
                }}>
                    <Flex direction={Flex.Direction.VERTICAL} style={{ gap: "16px" }}>
                        <div>
                            <Forms.FormTitle>Animation Control</Forms.FormTitle>
                            <Button
                                size={Button.Sizes.MEDIUM}
                                color={isRunning ? Button.Colors.RED : Button.Colors.GREEN}
                                onClick={toggleAnimation}
                                style={{ marginBottom: "8px" }}
                            >
                                {isRunning ? "Stop Animation" : "Start Animation"}
                            </Button>
                            <Forms.FormText>
                                Status: <span style={{ color: isRunning ? "var(--text-positive)" : "var(--text-muted)" }}>
                                    {isRunning ? "Running" : "Stopped"}
                                </span>
                            </Forms.FormText>
                        </div>

                        <div>
                            <Forms.FormTitle>Update Interval</Forms.FormTitle>
                            <TextInput
                                value={timeout.toString()}
                                onChange={handleTimeoutChange}
                                placeholder="Seconds between changes (minimum 5)"
                            />
                            <Forms.FormText>
                                How long each status message will be displayed before changing to the next one.
                            </Forms.FormText>
                        </div>

                        <div>
                            <Flex direction={Flex.Direction.HORIZONTAL} align={Flex.Align.CENTER}>
                                <div style={{ flexGrow: 1 }}>
                                    <Forms.FormTitle>Randomize Order</Forms.FormTitle>
                                    <Forms.FormText>Shuffle the order of status messages</Forms.FormText>
                                </div>
                                <Switch
                                    value={randomize}
                                    onChange={handleRandomizeChange}
                                />
                            </Flex>
                        </div>
                    </Flex>
                </div>
            )}
        </div>
    );
}

const settings = definePluginSettings({
    timeout: {
        type: OptionType.NUMBER,
        description: "Delay between status changes (in seconds)",
        default: 10,
        minimum: 5
    },
    animation: {
        type: OptionType.STRING,
        description: "Your status animation steps",
        default: JSON.stringify([{ text: "Hey there!" }])
    },
    randomize: {
        type: OptionType.BOOLEAN,
        description: "Randomize status order",
        default: false
    }
});

let currentIndex = 0;
let statusInterval: NodeJS.Timeout | null = null;

function StatusIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24">
            <path
                fill="currentColor"
                d="M12 2C6.477 2 2 6.477 2 12c0 5.524 4.477 10 10 10s10-4.476 10-10c0-5.523-4.477-10-10-10zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm1-13h-2v6l5.25 3.15.75-1.23-4-2.42V7z"
            />
        </svg>
    );
}

export default definePlugin({
    name: "AnimatedStatus",
    description: "Animate your Discord status with multiple messages",
    authors: [{
        id: 705545572299571220n,
        name: "shxdes69"
    }],
    settings,
    settingsAboutComponent: () => (
        <Forms.FormText>
            Configure your animated status messages below. Each message will display for the specified duration before changing to the next one.
            Click "Start Animation" to begin cycling through your status messages.
        </Forms.FormText>
    ),
    settingsPanel: AnimatedStatusSettings,

    toolboxActions: {
        "Manage Status Animation": () => openModal(props => (
            <ModalRoot {...props} size={ModalSize.MEDIUM}>
                <ModalContent>
                    <AnimatedStatusSettings />
                    <Flex style={{ gap: "8px", marginTop: "16px", justifyContent: "flex-end" }}>
                        <Button
                            onClick={props.onClose}
                            color={Button.Colors.BRAND}
                            size={Button.Sizes.SMALL}
                        >
                            Done
                        </Button>
                    </Flex>
                </ModalContent>
            </ModalRoot>
        ))
    },

    StatusIcon,

    start() {
    },

    stop() {
        if (statusInterval) {
            clearInterval(statusInterval);
            statusInterval = null;
            logger.info("Status animation stopped, current status preserved");
        }
    },

    async startAnimation() {
        try {
            const animation = safeParseJSON(settings.store.animation);
            if (animation.length === 0) {
                Toasts.show({
                    message: "Add some status animations in settings!",
                    type: Toasts.Type.MESSAGE,
                    id: Toasts.genId()
                });
                return;
            }
            if (statusInterval) {
                clearInterval(statusInterval);
                statusInterval = null;
            }
            currentIndex = 0;
            await this.setStatus(animation[0]);
            logger.info("Animation started with", animation.length, "status messages");
            const intervalTime = Math.max(settings.store.timeout * 1000, 5000);
            statusInterval = setInterval(() => {
                logger.debug("Interval triggered, updating status...");
                this.updateStatus();
            }, intervalTime);

            logger.info("Status interval set to", intervalTime, "ms");

            Toasts.show({
                message: "Status animation started!",
                type: Toasts.Type.SUCCESS,
                id: Toasts.genId()
            });
        } catch (err) {
            logger.error("Failed to start animation:", err);
            Toasts.show({
                message: "Failed to start status animation",
                type: Toasts.Type.FAILURE,
                id: Toasts.genId()
            });
        }
    },

    openSettings() {
        openModal(props => (
            <ModalRoot {...props} size={ModalSize.MEDIUM}>
                <ModalContent>
                    <AnimatedStatusSettings />
                    <Flex style={{ gap: "8px", marginTop: "16px", justifyContent: "flex-end" }}>
                        <Button
                            onClick={props.onClose}
                            color={Button.Colors.BRAND}
                            size={Button.Sizes.SMALL}
                        >
                            Done
                        </Button>
                    </Flex>
                </ModalContent>
            </ModalRoot>
        ));
    },

    async setStatus(status: StatusStep | null) {
        try {
            const token = TokenModule.getToken();
            if (!token) {
                logger.error("No auth token found!");
                return;
            }

            const payload = {
                custom_status: status ? {
                    text: status.text,
                    emoji_name: status.emoji_name || null,
                    emoji_id: status.emoji_id || null,
                    expires_at: null
                } : null
            };

            const req = new XMLHttpRequest();
            req.open("PATCH", "/api/v9/users/@me/settings", true);
            req.setRequestHeader("authorization", token);
            req.setRequestHeader("content-type", "application/json");

            req.onload = () => {
                if (req.status >= 400) {
                    let errorMsg = "Unknown error";
                    try {
                        const response = JSON.parse(req.response);
                        if (response.errors?.custom_status?._errors?.[0]?.message) {
                            errorMsg = response.errors.custom_status._errors[0].message;
                        }
                    } catch (e) {
                        if (req.status === 401) errorMsg = "Invalid token";
                    }
                    logger.error("Failed to update status:", errorMsg);
                    Toasts.show({
                        message: `Failed to update status: ${errorMsg}`,
                        type: Toasts.Type.FAILURE,
                        id: Toasts.genId()
                    });
                } else {
                    if (status) {
                        logger.info("Status updated to:", status.text);
                        logger.debug("Next update in", settings.store.timeout, "seconds");
                    } else {
                        logger.info("Status cleared");
                    }
                }
            };

            req.onerror = () => {
                logger.error("Network error while updating status");
                Toasts.show({
                    message: "Network error while updating status",
                    type: Toasts.Type.FAILURE,
                    id: Toasts.genId()
                });
            };

            req.send(JSON.stringify(payload));
        } catch (err) {
            logger.error("Failed to update status:", err);
        }
    },

    async updateStatus() {
        try {
            const animation = safeParseJSON(settings.store.animation);
            if (animation.length === 0) {
                if (statusInterval) {
                    clearInterval(statusInterval);
                    statusInterval = null;
                }
                return;
            }

            const nextIndex = settings.store.randomize
                ? Math.floor(Math.random() * animation.length)
                : (currentIndex + 1) % animation.length;

            currentIndex = nextIndex;
            await this.setStatus(animation[currentIndex]);
        } catch (err) {
            logger.error("Failed to update status:", err);
            if (statusInterval) {
                clearInterval(statusInterval);
                statusInterval = null;
            }
            Toasts.show({
                message: "Status animation stopped due to an error",
                type: Toasts.Type.FAILURE,
                id: Toasts.genId()
            });
        }
    }
});
