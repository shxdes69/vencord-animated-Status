/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 shxdes69
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./index.css";

import { definePluginSettings } from "@api/Settings";
import { getUserSettingLazy } from "@api/UserSettings";
import ErrorBoundary from "@components/ErrorBoundary";
import { ModalContent, ModalRoot, ModalSize, openModal } from "@utils/modal";
import definePlugin, { OptionType } from "@utils/types";
import { Button, Flex, Forms, IconUtils, Menu, Popout, React, Slider, Switch, TextInput, Toasts, Tooltip, UserStore } from "@webpack/common";

const CustomStatus = getUserSettingLazy<Partial<{
    text: string;
    emojiId: string;
    emojiName: string;
    expiresAtMs: string;
    createdAtMs: string;
}>>("status", "customStatus")!;

const StatusSetting = getUserSettingLazy<string>("status", "status");

interface StatusStep {
    text: string;
    emoji_name?: string;
    emoji_id?: string;
    animated?: boolean;
    category?: string;
    status?: "online" | "idle" | "dnd" | "invisible";
}

function safeParseJSON(jsonString: string, fallback: StatusStep[] = []): StatusStep[] {
    if (!jsonString) return fallback;
    try {
        const parsed = JSON.parse(jsonString);
        return Array.isArray(parsed) ? parsed : fallback;
    } catch {
        return fallback;
    }
}

function getUniqueCategories(steps: StatusStep[]): string[] {
    const categories = steps
        .map(step => step.category)
        .filter((category): category is string =>
            category !== undefined && category !== null && category !== ""
        );

    return [...new Set(categories)];
}

function StatusPreview({ status, label }: { status: StatusStep | null; label?: string; }) {
    if (!status) return null;

    const currentUser = UserStore.getCurrentUser();
    const avatarURL = currentUser?.getAvatarURL?.() || currentUser?.avatar
        ? `https://cdn.discordapp.com/avatars/${currentUser.id}/${currentUser.avatar}.png?size=128`
        : "https://cdn.discordapp.com/embed/avatars/0.png";
    const username = currentUser?.username || "User";
    const displayName = (currentUser as any)?.global_name || username;

    const statusColors = {
        online: "#43b581",
        idle: "#faa61a",
        dnd: "#f04747",
        invisible: "#747f8d"
    };

    return (
        <div style={{
            marginBottom: "16px",
            padding: "16px",
            borderRadius: "8px",
            background: "var(--background-secondary)",
            border: "2px solid var(--background-modifier-selected)"
        }}>
            {label && (
                <div style={{
                    fontSize: "14px",
                    marginBottom: "12px",
                    color: "var(--white-500)",
                    fontWeight: 600
                }}>
                    {label}
                </div>
            )}
            <Flex direction={Flex.Direction.HORIZONTAL} align={Flex.Align.CENTER} style={{ gap: "12px" }}>
                <div style={{ position: "relative" }}>
                    <img
                        src={avatarURL}
                        alt={username}
                        style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%"
                        }}
                    />
                    {status.status && (
                        <div style={{
                            position: "absolute",
                            bottom: "-2px",
                            right: "-2px",
                            width: "14px",
                            height: "14px",
                            borderRadius: "50%",
                            backgroundColor: statusColors[status.status] || statusColors.online,
                            border: "2px solid var(--background-secondary)"
                        }}>
                        </div>
                    )}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{
                        color: "var(--white-500)",
                        fontSize: "16px",
                        fontWeight: 600,
                        marginBottom: "4px"
                    }}>
                        {displayName}
                    </div>
                    <div style={{
                        color: "var(--white-500)",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                    }}>
                        {status.emoji_name && (
                            <span style={{ fontSize: "16px" }}>
                                {status.emoji_id ? (
                                    <img
                                        src={`https://cdn.discordapp.com/emojis/${status.emoji_id}.${status.animated ? "gif" : "png"}`}
                                        alt={status.emoji_name}
                                        style={{ width: "16px", height: "16px", verticalAlign: "middle" }}
                                    />
                                ) : status.emoji_name}
                            </span>
                        )}
                        {status.text || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No custom status</span>}
                    </div>
                    {status.category && (
                        <div className="vc-animated-status-category-pill active" style={{ marginTop: "6px" }}>
                            {status.category}
                        </div>
                    )}
                </div>
            </Flex>
        </div>
    );
}

function StatusCard({ status, onDelete, onEdit, index, onDragStart, onDragEnd, onDragOver, onDrop, draggedIndex }: {
    status: StatusStep;
    onDelete: () => void;
    onEdit: (updatedStatus: StatusStep) => void;
    index: number;
    onDragStart: (e: React.DragEvent, index: number) => void;
    onDragEnd: () => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, index: number) => void;
    draggedIndex: number | null;
}) {
    const [isEditing, setIsEditing] = React.useState(false);
    const [editText, setEditText] = React.useState(status.text || "");
    const [editCategory, setEditCategory] = React.useState(status.category || "");
    const [editStatus, setEditStatus] = React.useState(status.status);

    const statusNames = {
        online: "Online",
        idle: "Idle",
        dnd: "Do Not Disturb",
        invisible: "Invisible"
    };

    const handleSaveEdit = () => {
        const updatedStatus = {
            ...status,
            text: editText,
            category: editCategory || undefined,
            status: editStatus
        };
        onEdit(updatedStatus);
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditText(status.text || "");
        setEditCategory(status.category || "");
        setEditStatus(status.status);
        setIsEditing(false);
    };

    return (
        <div
            className={`vc-animated-status-item ${draggedIndex === index ? 'dragging' : ''}`}
            draggable={!isEditing}
            onDragStart={e => onDragStart(e, index)}
            onDragEnd={onDragEnd}
            onDragOver={onDragOver}
            onDrop={e => onDrop(e, index)}
        >
            {isEditing ? (
                <div className="vc-animated-status-card" style={{ padding: "16px", margin: 0 }}>
                    <div style={{ marginBottom: "16px" }}>
                        <Forms.FormTitle style={{ marginBottom: "8px", color: "var(--white-500)" }}>
                            Edit Status Message
                        </Forms.FormTitle>
                        <TextInput
                            className="vc-animated-status-input"
                            placeholder="Status text"
                            value={editText}
                            onChange={setEditText}
                            style={{ marginBottom: "12px" }}
                        />
                        <TextInput
                            className="vc-animated-status-input"
                            placeholder="Category (optional)"
                            value={editCategory}
                            onChange={setEditCategory}
                            style={{ marginBottom: "12px" }}
                        />
                        <StatusSelector value={editStatus} onChange={setEditStatus} />
                    </div>
                    <Flex direction={Flex.Direction.HORIZONTAL} style={{ gap: "12px", justifyContent: "flex-end" }}>
                        <Button
                            className="vc-animated-status-button secondary"
                            size={Button.Sizes.SMALL}
                            color={Button.Colors.PRIMARY}
                            onClick={handleCancelEdit}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="vc-animated-status-button primary"
                            size={Button.Sizes.SMALL}
                            color={Button.Colors.BRAND}
                            onClick={handleSaveEdit}
                        >
                            Save Changes
                        </Button>
                    </Flex>
                </div>
            ) : (
                <Flex direction={Flex.Direction.HORIZONTAL} align={Flex.Align.CENTER} style={{ gap: "16px", padding: "4px" }}>
                    <div style={{
                        fontSize: "18px",
                        color: "var(--interactive-normal)",
                        cursor: "grab",
                        opacity: 0.6,
                        transition: "opacity 0.2s ease"
                    }}>
                        :::
                    </div>
                    {status.emoji_name && (
                        <div style={{
                            fontSize: "28px",
                            width: "40px",
                            height: "40px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "var(--background-secondary)",
                            borderRadius: "50%",
                            border: "2px solid var(--background-modifier-accent)",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
                        }}>
                            {status.emoji_id ? (
                                <img
                                    src={`https://cdn.discordapp.com/emojis/${status.emoji_id}.${status.animated ? "gif" : "png"}`}
                                    alt={status.emoji_name}
                                    style={{ width: "28px", height: "28px" }}
                                />
                            ) : status.emoji_name}
                        </div>
                    )}
                    <div style={{ flexGrow: 1, overflow: "hidden", minWidth: 0 }}>
                        <div style={{
                            color: "var(--white-500)",
                            fontSize: "15px",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            marginBottom: "4px"
                        }}>
                            {status.text || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Emoji Only</span>}
                        </div>
                        <div style={{
                            display: "flex",
                            gap: "12px",
                            alignItems: "center",
                            flexWrap: "wrap"
                        }}>
                            {status.category && (
                                <div className="vc-animated-status-category-pill" style={{ margin: 0 }}>
                                    {status.category}
                                </div>
                            )}
                            {status.status && (
                                <div className={`vc-animated-status-indicator ${status.status}`}>
                                    {statusNames[status.status]}
                                </div>
                            )}
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <Tooltip text="Edit Status">
                            {({ onMouseEnter, onMouseLeave }) => (
                                <Button
                                    className="vc-animated-status-button secondary"
                                    size={Button.Sizes.SMALL}
                                    color={Button.Colors.PRIMARY}
                                    onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        setIsEditing(true);
                                    }}
                                    onMouseEnter={onMouseEnter}
                                    onMouseLeave={onMouseLeave}
                                    style={{ padding: "6px 10px", minWidth: "unset" }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                                    </svg>
                                </Button>
                            )}
                        </Tooltip>
                        <Tooltip text="Delete Status">
                            {({ onMouseEnter, onMouseLeave }) => (
                                <Button
                                    className="vc-animated-status-button danger"
                                    size={Button.Sizes.SMALL}
                                    color={Button.Colors.RED}
                                    onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        onDelete();
                                    }}
                                    onMouseEnter={onMouseEnter}
                                    onMouseLeave={onMouseLeave}
                                    style={{ padding: "6px 10px", minWidth: "unset" }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                                    </svg>
                                </Button>
                            )}
                        </Tooltip>
                    </div>
                </Flex>
            )}
        </div>
    );
}

function CategorySelector({
    categories,
    activeCategory,
    onCategoryChange
}: {
    categories: string[];
    activeCategory: string | null;
    onCategoryChange: (category: string | null) => void;
}) {
    return (
        <div className="vc-animated-status-card" style={{ marginBottom: "20px" }}>
            <div className="vc-animated-status-section-header" style={{ marginBottom: "16px" }}>
                <svg className="vc-animated-status-section-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M10 4H4c-1.11 0-2 .89-2 2v3h2V6h4V4zm6 0v2h4v3h2V6c0-1.11-.89-2-2-2h-4zm-6 15H4v-3H2v3c0 1.11.89 2 2 2h4v-2zm6 0v2h4c1.11 0 2-.89 2-2v-3h-2v3h-4z" fill="currentColor" />
                </svg>
                <h3 className="vc-animated-status-section-title">Filter by Category</h3>
            </div>
            <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                alignItems: "center"
            }}>
                <div
                    className={`vc-animated-status-category-pill ${activeCategory === null ? 'active' : ''}`}
                    onClick={() => onCategoryChange(null)}
                    style={{ cursor: "pointer" }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    All Categories
                </div>
                {categories.map(category => (
                    <div
                        key={category}
                        className={`vc-animated-status-category-pill ${activeCategory === category ? 'active' : ''}`}
                        onClick={() => onCategoryChange(category)}
                        style={{ cursor: "pointer" }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                        {category}
                    </div>
                ))}
                {categories.length === 0 && (
                    <div style={{
                        color: "var(--text-muted)",
                        fontStyle: "italic",
                        padding: "8px 16px",
                        background: "var(--background-tertiary)",
                        borderRadius: "8px",
                        border: "1px dashed var(--background-modifier-accent)"
                    }}>
                        No categories defined yet. Add statuses with categories to see them here.
                    </div>
                )}
            </div>
        </div>
    );
}

function StatusSelector({ value, onChange }: {
    value: "online" | "idle" | "dnd" | "invisible" | undefined;
    onChange: (status: "online" | "idle" | "dnd" | "invisible" | undefined) => void;
}) {
    const statuses = [
        { id: "online", name: "Online", color: "#43b581", icon: "●" },
        { id: "idle", name: "Idle", color: "#faa61a", icon: "◐" },
        { id: "dnd", name: "Do Not Disturb", color: "#f04747", icon: "⊝" },
        { id: "invisible", name: "Invisible", color: "#747f8d", icon: "○" }
    ] as const;

    return (
        <div style={{ marginBottom: "16px" }}>
            <Forms.FormTitle style={{
                marginBottom: "12px",
                color: "var(--white-500)",
                fontSize: "14px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "8px"
            }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                Discord Status
            </Forms.FormTitle>
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "8px"
            }}>
                {statuses.map(status => (
                    <div
                        key={status.id}
                        className={`vc-animated-status-indicator ${status.id} ${value === status.id ? 'active' : ''}`}
                        onClick={() => onChange(status.id as "online" | "idle" | "dnd" | "invisible")}
                        style={{
                            cursor: "pointer",
                            padding: "12px 16px",
                            borderRadius: "8px",
                            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                            transform: value === status.id ? "translateY(-1px)" : "none",
                            boxShadow: value === status.id ? "0 4px 12px rgba(0, 0, 0, 0.15)" : "none",
                            border: value === status.id ? `2px solid ${status.color}` : "2px solid transparent"
                        }}
                    >
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            justifyContent: "center"
                        }}>
                            <div style={{
                                width: "14px",
                                height: "14px",
                                borderRadius: "50%",
                                backgroundColor: status.color,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "white",
                                fontSize: "10px",
                                fontWeight: "bold",
                                boxShadow: `0 0 8px ${status.color}40`
                            }}>
                                {status.icon}
                            </div>
                            <div style={{
                                fontSize: "13px",
                                fontWeight: 600,
                                color: value === status.id ? "var(--white-500)" : "var(--white-500)"
                            }}>
                                {status.name}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ManageCategoriesModal({ categories, onClose, onSave }: {
    categories: string[];
    onClose: () => void;
    onSave: (newCategories: string[]) => void;
}) {
    const [localCategories, setLocalCategories] = React.useState<string[]>(categories);
    const [newCategory, setNewCategory] = React.useState("");

    const addCategory = () => {
        if (!newCategory.trim()) return;

        const formattedCategory = newCategory.trim().toLowerCase();

        if (localCategories.includes(formattedCategory)) {
            Toasts.show({
                message: "Category already exists!",
                type: Toasts.Type.FAILURE,
                id: Toasts.genId()
            });
            return;
        }

        setLocalCategories([...localCategories, formattedCategory]);
        setNewCategory("");
    };

    const removeCategory = (category: string) => {
        setLocalCategories(localCategories.filter(c => c !== category));
    };

    return (
        <>
            <ModalContent>
                <Forms.FormTitle tag="h2" style={{ marginBottom: "16px", color: "var(--white-500)" }}>
                    Manage Categories
                </Forms.FormTitle>

                <div style={{
                    background: "var(--background-secondary)",
                    padding: "16px",
                    borderRadius: "8px",
                    marginBottom: "16px",
                    border: "2px solid var(--background-modifier-selected)"
                }}>
                    <Forms.FormTitle style={{ marginBottom: "12px", color: "var(--white-500)" }}>
                        Add New Category
                    </Forms.FormTitle>

                    <Flex direction={Flex.Direction.HORIZONTAL} style={{ gap: "8px", marginBottom: "12px" }}>
                        <TextInput
                            placeholder="Enter category name"
                            value={newCategory}
                            onChange={setNewCategory}
                            onKeyDown={(e: React.KeyboardEvent) => {
                                if (e.key === "Enter") {
                                    addCategory();
                                }
                            }}
                            style={{ flexGrow: 1 }}
                        />
                        <Button
                            onClick={addCategory}
                            color={Button.Colors.BRAND}
                            disabled={!newCategory.trim()}
                        >
                            Add
                        </Button>
                    </Flex>

                    <div style={{
                        background: "var(--background-tertiary)",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid var(--background-modifier-accent)",
                        color: "var(--text-muted)",
                        fontSize: "12px"
                    }}>
                        Categories help organize your status messages
                    </div>
                </div>

                <div style={{
                    background: "var(--background-secondary)",
                    padding: "16px",
                    borderRadius: "8px",
                    border: "2px solid var(--background-modifier-selected)"
                }}>
                    <Forms.FormTitle style={{ marginBottom: "12px", color: "var(--white-500)" }}>
                        Current Categories ({localCategories.length})
                    </Forms.FormTitle>

                    {localCategories.length === 0 ? (
                        <div className="vc-animated-status-card" style={{
                            textAlign: "center",
                            padding: "32px",
                            background: "var(--background-tertiary)",
                            border: "2px dashed var(--background-modifier-accent)"
                        }}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto 16px", opacity: 0.5 }}>
                                <path d="M10 4H4c-1.11 0-2 .89-2 2v3h2V6h4V4zm6 0v2h4v3h2V6c0-1.11-.89-2-2-2h-4zm-6 15H4v-3H2v3c0 1.11.89 2 2 2h4v-2zm6 0v2h4c1.11 0 2-.89 2-2v-3h-2v3h-4z" fill="var(--text-muted)" />
                            </svg>
                            <div style={{
                                color: "var(--text-muted)",
                                fontSize: "16px",
                                fontWeight: 500,
                                marginBottom: "8px"
                            }}>
                                No categories created yet
                            </div>
                            <div style={{
                                color: "var(--text-muted)",
                                fontSize: "14px",
                                lineHeight: "1.4"
                            }}>
                                Create categories to organize your animated statuses by theme, mood, or activity.
                            </div>
                        </div>
                    ) : (
                        <div className="vc-animated-status-scrollable" style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                            maxHeight: "300px",
                            overflowY: "auto"
                        }}>
                            {localCategories.map((category, index) => (
                                <div
                                    key={category}
                                    className="vc-animated-status-item"
                                    style={{ marginBottom: 0 }}
                                >
                                    <Flex direction={Flex.Direction.HORIZONTAL} align={Flex.Align.CENTER} style={{ gap: "16px" }}>
                                        <div style={{
                                            width: "32px",
                                            height: "32px",
                                            borderRadius: "50%",
                                            background: "var(--brand-experiment)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "var(--white-500)",
                                            fontSize: "14px",
                                            fontWeight: 700
                                        }}>
                                            {index + 1}
                                        </div>
                                        <div style={{ flexGrow: 1 }}>
                                            <div style={{
                                                color: "var(--white-500)",
                                                fontSize: "16px",
                                                fontWeight: 600,
                                                textTransform: "capitalize"
                                            }}>
                                                {category}
                                            </div>
                                            <div style={{
                                                color: "var(--text-muted)",
                                                fontSize: "13px",
                                                marginTop: "2px"
                                            }}>
                                                Category #{index + 1}
                                            </div>
                                        </div>
                                        <Tooltip text="Delete Category">
                                            {({ onMouseEnter, onMouseLeave }) => (
                                                <Button
                                                    className="vc-animated-status-button danger"
                                                    size={Button.Sizes.SMALL}
                                                    color={Button.Colors.RED}
                                                    onClick={() => removeCategory(category)}
                                                    onMouseEnter={onMouseEnter}
                                                    onMouseLeave={onMouseLeave}
                                                    style={{ padding: "8px 12px", minWidth: "unset" }}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                                                    </svg>
                                                </Button>
                                            )}
                                        </Tooltip>
                                    </Flex>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{
                    background: "var(--background-tertiary)",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    border: "1px solid var(--background-modifier-accent)",
                    color: "var(--text-muted)",
                    fontSize: "13px",
                    lineHeight: "1.4",
                    marginBottom: "20px"
                }}>
                    Tip: Categories will be automatically created when you add a status with a new category.
                </div>

                <Flex style={{ gap: "12px", justifyContent: "flex-end" }}>
                    <Button
                        className="vc-animated-status-button secondary"
                        onClick={onClose}
                        color={Button.Colors.PRIMARY}
                    >
                        Cancel
                    </Button>
                    <Button
                        className="vc-animated-status-button primary"
                        onClick={() => onSave(localCategories)}
                        color={Button.Colors.BRAND}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: "6px" }}>
                            <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z" />
                        </svg>
                        Save Categories
                    </Button>
                </Flex>
            </ModalContent>
        </>
    );
}

function AnimatedStatusSettings() {
    const [activeTab, setActiveTab] = React.useState("Messages");
    const [animation, setAnimation] = React.useState<StatusStep[]>(() => {
        return safeParseJSON(settings.store.animation, [{ text: "Hey there!" }]);
    });
    const [isRunning, setIsRunning] = React.useState(false);
    const [newStatus, setNewStatus] = React.useState("");
    const [newCategory, setNewCategory] = React.useState("");
    const [previewStatus, setPreviewStatus] = React.useState<StatusStep | null>(null);
    const [activeCategory, setActiveCategory] = React.useState<string | null>(null);
    const [selectedStatus, setSelectedStatus] = React.useState<"online" | "idle" | "dnd" | "invisible" | undefined>("online");
    const [categories, setCategories] = React.useState<string[]>(() => {
        return getUniqueCategories(safeParseJSON(settings.store.animation, []));
    });
    const [timeout, setTimeout] = React.useState(settings.store.timeout);
    const [randomize, setRandomize] = React.useState(settings.store.randomize);
    const [autoStart, setAutoStart] = React.useState(settings.store.autoStart);
    const [currentStatus, setCurrentStatus] = React.useState<StatusStep | null>(null);
    const [countdown, setCountdown] = React.useState(timeout);

    React.useEffect(() => {
        setIsRunning(statusInterval !== null);
        if (statusInterval !== null && currentIndex >= 0 && animation.length > 0) {
            setCurrentStatus(animation[currentIndex]);
        } else {
            setCurrentStatus(null);
        }
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

            if (statusInterval !== null && currentIndex >= 0 && newAnimation.length > 0) {
                setCurrentStatus(newAnimation[currentIndex]);
            }
        };
        const intervalId = setInterval(checkSettings, 1000);
        return () => clearInterval(intervalId);
    }, [animation, timeout, randomize]);

    React.useEffect(() => {
        const newCategories = getUniqueCategories(animation);
        if (JSON.stringify(newCategories) !== JSON.stringify(categories)) {
            setCategories(newCategories);
            if (activeCategory && !newCategories.includes(activeCategory)) {
                setActiveCategory(null);
            }
        }
    }, [animation]);

    React.useEffect(() => {
        if (!newStatus.trim()) {
            setPreviewStatus(null);
            return;
        }
        const cleanInput = newStatus.replace(/^\\/, "");
        const emojiMatch = cleanInput.match(/<a?:([^:]+):(\d+)>/);
        const preview: StatusStep = {
            text: cleanInput,
            status: selectedStatus
        };

        if (emojiMatch) {
            preview.animated = cleanInput.includes("<a:");
            preview.emoji_name = emojiMatch[1];
            preview.emoji_id = emojiMatch[2];
            preview.text = preview.text.replace(/<a?:[^:]+:\d+>/, "").trim();
        }

        setPreviewStatus(preview);
    }, [newStatus, selectedStatus]);

    React.useEffect(() => {
        let countdownInterval: NodeJS.Timeout | null = null;

        if (isRunning) {
            setCountdown(timeout);
            countdownInterval = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        return timeout;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (countdownInterval) {
                clearInterval(countdownInterval);
            }
        };
    }, [isRunning, timeout]);
    const filteredAnimation = React.useMemo(() => {
        if (activeCategory === null) return animation;
        return animation.filter(step => step.category === activeCategory);
    }, [animation, activeCategory]);
    const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
        try {
            const dragImage = document.createElement("div");
            dragImage.style.position = "absolute";
            dragImage.style.top = "-1000px";
            dragImage.style.left = "-1000px";
            dragImage.style.width = "100px";
            dragImage.style.height = "20px";
            dragImage.style.background = "transparent";
            dragImage.textContent = "Dragging status...";
            document.body.appendChild(dragImage);
            e.dataTransfer.setDragImage(dragImage, 0, 0);
            e.dataTransfer.setData("text/plain", index.toString());
        } catch (err) {
            console.error("Failed to create drag image:", err);
        }
    };
    const handleDragEnd = () => {
        setDraggedIndex(null);
        const dragImages = document.querySelectorAll('div[style*="position: absolute"][style*="top: -1000px"][style*="left: -1000px"]');
        dragImages.forEach(img => {
            if (img.textContent === "Dragging status...") {
                document.body.removeChild(img);
            }
        });
    };
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.boxShadow = "0 0 0 2px var(--brand-experiment)";
            e.currentTarget.style.transform = "translateY(-2px)";
        }
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === dropIndex) return;
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.boxShadow = "";
            e.currentTarget.style.transform = "";
        }
        const actualDraggedIndex = activeCategory === null
            ? draggedIndex
            : animation.findIndex(step => step === filteredAnimation[draggedIndex]);

        const actualDropIndex = activeCategory === null
            ? dropIndex
            : animation.findIndex(step => step === filteredAnimation[dropIndex]);

        if (actualDraggedIndex === -1 || actualDropIndex === -1) return;
        const newAnimation = [...animation];
        const [draggedItem] = newAnimation.splice(actualDraggedIndex, 1);
        newAnimation.splice(actualDropIndex, 0, draggedItem);
        setAnimation(newAnimation);
        settings.store.animation = JSON.stringify(newAnimation);
        setDraggedIndex(null);
        Toasts.show({
            message: "Status order updated",
            type: Toasts.Type.SUCCESS,
            id: Toasts.genId()
        });
    };

    const handleEditStatus = (index: number, updatedStatus: StatusStep) => {
        const actualIndex = activeCategory === null
            ? index
            : animation.findIndex(step => step === filteredAnimation[index]);
        if (actualIndex === -1) return;
        const newAnimation = [...animation];
        newAnimation[actualIndex] = updatedStatus;
        setAnimation(newAnimation);
        settings.store.animation = JSON.stringify(newAnimation);
    };
    const isFirstMount = React.useRef(true);
    const previousCategory = React.useRef(activeCategory);
    React.useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false;
            previousCategory.current = activeCategory;
            return;
        }
        if (isRunning && statusInterval && previousCategory.current !== activeCategory) {
            previousCategory.current = activeCategory;

            const plugin = window.Vencord?.Plugins?.plugins?.AnimatedStatus as unknown as {
                stop?: () => void;
                startAnimation?: (category?: string) => Promise<void>;
            };

            if (plugin) {
                plugin.stop?.();
                window.setTimeout(function () {
                    try {
                        const startPromise = plugin.startAnimation?.(activeCategory || undefined);
                        if (startPromise && typeof startPromise.then === "function") {
                            startPromise.then(() => {
                                if (filteredAnimation.length > 0) {
                                    setCurrentStatus(filteredAnimation[0]);
                                }
                            }).catch(() => { });
                        } else if (filteredAnimation.length > 0) {
                            setCurrentStatus(filteredAnimation[0]);
                        }
                    } catch { }
                }, 100);
            }
        }
    }, [activeCategory, isRunning]);

    const handleTimeoutChange = (value: number) => {
        settings.store.timeout = value;
        if (isRunning) {
            const plugin = window.Vencord?.Plugins?.plugins?.AnimatedStatus as unknown as {
                updateInterval?: (timeout: number) => void;
            };
            plugin?.updateInterval?.(value);
        }
    };

    const handleRandomizeChange = (value: boolean) => {
        setRandomize(value);
        settings.store.randomize = value;
    };
    const handleAutoStartChange = (value: boolean) => {
        setAutoStart(value);
        settings.store.autoStart = value;
    };
    const handleAdd = () => {
        if (!newStatus.trim()) return;
        const cleanInput = newStatus.replace(/^\\/, "");
        const emojiMatch = cleanInput.match(/<a?:([^:]+):(\d+)>/);
        const newStep: StatusStep = {
            text: cleanInput,
            category: newCategory.trim() ? newCategory.trim().toLowerCase() : undefined,
            status: selectedStatus
        };

        if (emojiMatch) {
            newStep.animated = cleanInput.includes("<a:");
            newStep.emoji_name = emojiMatch[1];
            newStep.emoji_id = emojiMatch[2];
            newStep.text = newStep.text.replace(/<a?:[^:]+:\d+>/, "").trim();
        }

        const newAnimation = [...animation, newStep];
        setAnimation(newAnimation);
        settings.store.animation = JSON.stringify(newAnimation);
        setNewStatus("");
        setPreviewStatus(null);
        Toasts.show({
            message: "Status added successfully!",
            type: Toasts.Type.SUCCESS,
            id: Toasts.genId()
        });
    };

    const deleteStep = (index: number) => {
        const newAnimation = animation.filter((_, i) => i !== index);
        setAnimation(newAnimation);
        settings.store.animation = JSON.stringify(newAnimation);
        Toasts.show({
            message: "Status deleted",
            type: Toasts.Type.SUCCESS,
            id: Toasts.genId()
        });
    };



    const toggleAnimation = () => {
        const plugin = window.Vencord?.Plugins?.plugins?.AnimatedStatus as unknown as {
            stop?: () => void;
            startAnimation?: (category?: string) => Promise<void>;
        };
        if (!plugin) return;

        if (isRunning) {
            plugin.stop?.();
            setCurrentStatus(null);
        } else {
            try {
                const startPromise = plugin.startAnimation?.(activeCategory || undefined);
                if (startPromise && typeof startPromise.then === "function") {
                    startPromise.then(() => {
                        if (filteredAnimation.length > 0) {
                            setCurrentStatus(filteredAnimation[0]);
                        }
                    }).catch(() => { });
                } else if (filteredAnimation.length > 0) {
                    setCurrentStatus(filteredAnimation[0]);
                }
            } catch { }
        }
        setIsRunning(!isRunning);
    };

    return (
        <div style={{ padding: "16px" }}>
            <div style={{
                display: "flex",
                marginBottom: "20px",
                borderBottom: "2px solid var(--background-modifier-selected)"
            }}>
                {["Messages", "Settings"].map(tab => (
                    <div
                        key={tab}
                        style={{
                            padding: "12px 16px",
                            cursor: "pointer",
                            borderBottom: activeTab === tab ? "3px solid var(--brand-experiment)" : "3px solid transparent",
                            color: "var(--white-500)",
                            fontWeight: activeTab === tab ? 700 : 500,
                            background: activeTab === tab ? "var(--background-modifier-selected)" : "transparent"
                        }}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </div>
                ))}
            </div>

            {activeTab === "Messages" ? (
                <>
                    <div style={{
                        background: "var(--background-secondary)",
                        padding: "16px",
                        borderRadius: "8px",
                        marginBottom: "16px",
                        border: "2px solid var(--background-modifier-selected)"
                    }}>
                        <Forms.FormTitle style={{
                            color: "var(--white-500)",
                            marginBottom: "16px",
                            fontSize: "16px"
                        }}>
                            Add New Status
                        </Forms.FormTitle>
                        {previewStatus && <StatusPreview status={previewStatus} label="Preview" />}

                        <Flex direction={Flex.Direction.HORIZONTAL} style={{ gap: "8px", marginBottom: "8px" }}>
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

                        <Flex direction={Flex.Direction.HORIZONTAL} style={{ gap: "8px", marginBottom: "16px" }}>
                            <TextInput
                                placeholder="Category (optional)"
                                value={newCategory}
                                onChange={setNewCategory}
                                style={{ flexGrow: 1 }}
                            />
                            <Button
                                size={Button.Sizes.MEDIUM}
                                onClick={() => {
                                    openModal(props => (
                                        <ModalRoot {...props} size={ModalSize.MEDIUM}>
                                            <ManageCategoriesModal
                                                categories={categories}
                                                onClose={props.onClose}
                                                onSave={newCategories => {
                                                    setCategories(newCategories);
                                                    props.onClose();
                                                    Toasts.show({
                                                        message: "Categories updated successfully!",
                                                        type: Toasts.Type.SUCCESS,
                                                        id: Toasts.genId()
                                                    });
                                                }}
                                            />
                                        </ModalRoot>
                                    ));
                                }}
                                color={Button.Colors.PRIMARY}
                            >
                                Manage Categories
                            </Button>
                        </Flex>

                        <StatusSelector value={selectedStatus} onChange={setSelectedStatus} />
                    </div>

                    <div style={{
                        background: "var(--background-tertiary)",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        border: "2px solid var(--background-modifier-selected)"
                    }}>
                        <Flex
                            align={Flex.Align.CENTER}
                            justify={Flex.Justify.BETWEEN}
                            style={{
                                cursor: "pointer",
                                userSelect: "none",
                            }}
                            onClick={() => {
                                const collapsible = document.getElementById("emoji-guide-collapsible");
                                const arrow = document.getElementById("emoji-guide-arrow");
                                if (collapsible) {
                                    const isCurrentlyExpanded = collapsible.style.maxHeight !== "0px" && collapsible.style.maxHeight !== "";
                                    collapsible.style.maxHeight = isCurrentlyExpanded ? "0px" : "300px";
                                    collapsible.style.opacity = isCurrentlyExpanded ? "0" : "1";
                                    collapsible.style.marginTop = isCurrentlyExpanded ? "0px" : "12px";
                                    collapsible.style.transform = isCurrentlyExpanded ? "translateY(-10px)" : "translateY(0)";

                                    if (arrow) {
                                        arrow.style.transform = isCurrentlyExpanded ? "rotate(0deg)" : "rotate(180deg)";
                                        arrow.style.color = isCurrentlyExpanded ? "var(--interactive-normal)" : "var(--text-link)";
                                    }
                                }
                            }}
                        >
                            <Forms.FormTitle tag="h5" style={{
                                marginBottom: "0",
                                fontSize: "13px",
                                color: "var(--white-500)"
                            }}>
                                EMOJI GUIDE
                            </Forms.FormTitle>
                            <div style={{
                                fontSize: "16px",
                                color: "var(--interactive-normal)",
                                transform: "rotate(0deg)",
                                transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            }} id="emoji-guide-arrow">▼</div>
                        </Flex>
                        <div
                            id="emoji-guide-collapsible"
                            style={{
                                maxHeight: "0px",
                                overflow: "hidden",
                                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                opacity: 0,
                                marginTop: "0px",
                                transform: "translateY(-10px)"
                            }}
                        >
                            <Forms.FormText style={{ marginBottom: "8px", marginTop: "12px" }}>
                                • <span style={{ fontWeight: 600, color: "var(--header-secondary)" }}>Regular emoji:</span>
                                <span style={{ color: "var(--text-normal)" }}> Use emoji picker (Win + .) or copy from elsewhere</span>
                            </Forms.FormText>
                            <Forms.FormText style={{ marginBottom: "8px" }}>
                                • <span style={{ fontWeight: 600, color: "var(--header-secondary)" }}>Discord/Nitro emoji:</span>
                                <span style={{ color: "var(--text-normal)" }}> Use the emoji picker in Discord chat or type <code>\</code> (backslash) followed by the emoji name</span>
                            </Forms.FormText>
                            <Forms.FormText style={{ marginBottom: "8px" }}>
                                • <span style={{ fontWeight: 600, color: "var(--header-secondary)" }}>Custom emoji format:</span>
                                <span style={{ color: "var(--text-normal)" }}> <code>&lt;:emojiname:123456789&gt;</code> (Replace with actual emoji ID)</span>
                            </Forms.FormText>
                            <Forms.FormText>
                                • <span style={{ color: "var(--text-positive)" }}>Tip:</span>
                                <span style={{ color: "var(--text-normal)" }}> Right-click any emoji in Discord and select "Copy Emoji ID" to get its ID</span>
                            </Forms.FormText>
                        </div>
                    </div>

                    {categories.length > 0 && (
                        <CategorySelector
                            categories={categories}
                            activeCategory={activeCategory}
                            onCategoryChange={setActiveCategory}
                        />
                    )}

                    {isRunning && currentStatus && (
                        <div style={{
                            background: "var(--background-secondary)",
                            padding: "16px",
                            borderRadius: "8px",
                            marginBottom: "16px",
                            border: "1px solid var(--background-modifier-accent)",
                            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)"
                        }}>
                            <Forms.FormTitle style={{
                                color: "var(--header-primary)",
                                marginBottom: "16px",
                                fontSize: "16px",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px"
                            }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2C6.477 2 2 6.477 2 12c0 5.524 4.477 10 10 10s10-4.476 10-10c0-5.523-4.477-10-10-10zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm1-13h-2v6l5.25 3.15.75-1.23-4-2.42V7z" fill="var(--text-positive)" />
                                </svg>
                                Current Active Status
                            </Forms.FormTitle>

                            <div style={{
                                background: "var(--background-tertiary)",
                                padding: "16px",
                                borderRadius: "8px",
                                border: "1px solid var(--background-modifier-accent)"
                            }}>
                                <Flex direction={Flex.Direction.HORIZONTAL} align={Flex.Align.CENTER} style={{ gap: "12px", marginBottom: "12px" }}>
                                    <div style={{
                                        width: "40px",
                                        height: "40px",
                                        borderRadius: "50%",
                                        overflow: "hidden",
                                        border: "2px solid var(--brand-experiment)"
                                    }}>
                                        <img
                                            src={UserStore.getCurrentUser() ? IconUtils.getUserAvatarURL(UserStore.getCurrentUser(), true, 128) : ""}
                                            alt="Profile"
                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                            onError={e => {
                                                e.currentTarget.src = "https://cdn.discordapp.com/embed/avatars/0.png";
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <div style={{
                                            color: "var(--header-primary)",
                                            fontWeight: 700,
                                            fontSize: "16px"
                                        }}>
                                            {UserStore.getCurrentUser()?.username || "User"}
                                        </div>

                                        <Flex direction={Flex.Direction.HORIZONTAL} align={Flex.Align.CENTER} style={{ gap: "8px" }}>
                                            {currentStatus.emoji_name && (
                                                <div style={{
                                                    fontSize: "16px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center"
                                                }}>
                                                    {currentStatus.emoji_id ? (
                                                        <img
                                                            src={`https://cdn.discordapp.com/emojis/${currentStatus.emoji_id}.png`}
                                                            alt={currentStatus.emoji_name}
                                                            style={{ width: "16px", height: "16px" }}
                                                        />
                                                    ) : currentStatus.emoji_name}
                                                </div>
                                            )}
                                            <div style={{
                                                color: "var(--text-normal)",
                                                fontWeight: 400,
                                                fontSize: "14px"
                                            }}>
                                                {currentStatus.text || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Emoji Only</span>}
                                            </div>
                                        </Flex>
                                    </div>
                                </Flex>

                                <div style={{
                                    marginTop: "12px",
                                    fontSize: "12px",
                                    color: "var(--text-positive)",
                                    background: "var(--background-secondary)",
                                    padding: "8px 12px",
                                    borderRadius: "4px",
                                    fontWeight: 500,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px"
                                }}>
                                    <span style={{ fontSize: "10px" }}>●</span>
                                    Animation running - changes in <span style={{ fontWeight: 700 }}>{countdown}</span> seconds
                                </div>
                            </div>
                        </div>
                    )}

                    <div style={{
                        background: "var(--background-secondary)",
                        padding: "16px",
                        borderRadius: "8px",
                        border: "1px solid var(--background-modifier-accent)",
                        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)"
                    }}>
                        <Flex justify={Flex.Justify.BETWEEN} align={Flex.Align.CENTER} style={{
                            marginBottom: "16px",
                            background: "var(--background-tertiary)",
                            padding: "12px 16px",
                            borderRadius: "8px",
                            border: "1px solid var(--background-modifier-accent)"
                        }}>
                            <Forms.FormTitle style={{
                                margin: 0,
                                color: "var(--header-primary)",
                                fontSize: "16px"
                            }}>Your Status Messages</Forms.FormTitle>
                            <Flex style={{ gap: "8px" }}>
                                <Button
                                    size={Button.Sizes.SMALL}
                                    color={isRunning ? Button.Colors.RED : Button.Colors.GREEN}
                                    onClick={toggleAnimation}
                                    style={{
                                        fontWeight: 600
                                    }}
                                >
                                    {isRunning ? "Stop" : "Start"} Animation
                                </Button>
                                {animation.length > 0 && (
                                    <Button
                                        size={Button.Sizes.SMALL}
                                        color={Button.Colors.RED}
                                        onClick={() => {
                                            settings.store.animation = "[]";
                                            setAnimation([]);
                                            Toasts.show({
                                                message: "All status messages cleared",
                                                type: Toasts.Type.SUCCESS,
                                                id: Toasts.genId()
                                            });
                                        }}
                                        style={{
                                            padding: "4px 8px",
                                            fontWeight: 600
                                        }}
                                    >
                                        Clear All
                                    </Button>
                                )}
                            </Flex>
                        </Flex>

                        {categories.length > 0 && (
                            <div style={{
                                marginBottom: "16px",
                                background: "var(--background-tertiary)",
                                padding: "12px",
                                borderRadius: "8px",
                                border: "2px solid var(--background-modifier-selected)"
                            }}>
                                <CategorySelector
                                    categories={categories}
                                    activeCategory={activeCategory}
                                    onCategoryChange={setActiveCategory}
                                />
                            </div>
                        )}

                        {filteredAnimation.length === 0 ? (
                            <div style={{
                                background: "var(--background-tertiary)",
                                borderRadius: "8px",
                                border: "1px dashed var(--background-modifier-accent)",
                                padding: "32px 16px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexDirection: "column"
                            }}>
                                <div style={{
                                    fontSize: "24px",
                                    marginBottom: "8px",
                                    color: "var(--text-muted)"
                                }}>
                                    {animation.length === 0 ? "📝" : "🔍"}
                                </div>
                                <Forms.FormText style={{
                                    fontStyle: "italic",
                                    color: "var(--text-muted)",
                                    textAlign: "center",
                                    fontSize: "14px"
                                }}>
                                    {animation.length === 0
                                        ? "No status messages added yet. Add some messages above!"
                                        : `No status messages in ${activeCategory} category. Add some or select another category.`}
                                </Forms.FormText>
                            </div>
                        ) : (
                            <div style={{
                                maxHeight: "400px",
                                overflowY: "auto",
                                background: "var(--background-tertiary)",
                                padding: "8px",
                                borderRadius: "8px",
                                border: "2px solid var(--background-modifier-selected)",
                                msOverflowStyle: "none",
                                scrollbarWidth: "none"
                            }} className="hide-scrollbar">
                                <style>{`
                                    .hide-scrollbar::-webkit-scrollbar {
                                        display: none;
                                    }
                                `}</style>
                                <div style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "8px",
                                    position: "relative"
                                }}>
                                    {draggedIndex !== null && (
                                        <div style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            background: "rgba(0, 0, 0, 0.1)",
                                            borderRadius: "8px",
                                            zIndex: 1,
                                            pointerEvents: "none"
                                        }} />
                                    )}
                                    {filteredAnimation.map((step, i) => (
                                        <StatusCard
                                            key={i}
                                            index={i}
                                            status={step}
                                            onDelete={() => deleteStep(animation.indexOf(step))}
                                            onEdit={updatedStatus => handleEditStatus(i, updatedStatus)}
                                            onDragStart={handleDragStart}
                                            onDragEnd={handleDragEnd}
                                            onDragOver={handleDragOver}
                                            onDrop={handleDrop}
                                            draggedIndex={draggedIndex}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div style={{
                    background: "var(--background-secondary)",
                    padding: "16px",
                    borderRadius: "8px",
                    border: "2px solid var(--background-modifier-selected)"
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
                            <Forms.FormTitle style={{
                                fontSize: "16px",
                                fontWeight: 600,
                                marginBottom: "8px",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px"
                            }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M13 3C8.03 3 4 7.03 4 12H1L4.89 15.89L8.78 12H5C5 7.58 8.58 4 13 4C17.42 4 21 7.58 21 12C21 16.42 17.42 20 13 20C10.17 20 7.72 18.45 6.37 16.11L5.43 16.67C7 19.3 9.8 21 13 21C17.97 21 22 16.97 22 12C22 7.03 17.97 3 13 3ZM12 7V12L16.25 14.52L16.75 13.67L13 11.5V7H12Z" fill="currentColor" />
                                </svg>
                                Update Interval
                            </Forms.FormTitle>
                            <div style={{
                                marginBottom: "16px",
                                padding: "20px",
                                borderRadius: "12px",
                                background: "var(--background-tertiary)",
                                boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
                                border: "1px solid var(--background-modifier-accent)"
                            }}>
                                <div className="slider-container" style={{
                                    position: "relative",
                                    marginBottom: "20px"
                                }}>
                                    <div style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        marginBottom: "4px"
                                    }}>
                                        <div style={{
                                            fontSize: "12px",
                                            fontWeight: 600,
                                            color: "var(--text-muted)"
                                        }}>FASTER (5s)</div>
                                        <div style={{
                                            fontSize: "12px",
                                            fontWeight: 600,
                                            color: "var(--text-muted)"
                                        }}>SLOWER (60s)</div>
                                    </div>
                                    <Flex align={Flex.Align.CENTER} style={{
                                        marginBottom: "12px",
                                        position: "relative"
                                    }}>
                                        <div style={{
                                            flex: 1,
                                            position: "relative"
                                        }}>
                                            <Slider
                                                initialValue={timeout}
                                                minValue={5}
                                                maxValue={60}
                                                markers={[5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60]}
                                                onValueChange={handleTimeoutChange}
                                                className="animated-status-slider"
                                            />
                                            <style>{`
                                                .animated-status-slider div[role="slider"] {
                                                    background-color: var(--text-positive) !important;
                                                    box-shadow: 0 0 8px rgba(59, 165, 93, 0.3) !important;
                                                    border: 2px solid white !important;
                                                    transform: scale(1.2) !important;
                                                    transition: transform 0.1s ease, box-shadow 0.1s ease !important;
                                                }
                                                .animated-status-slider div[role="slider"]:hover {
                                                    transform: scale(1.3) !important;
                                                    box-shadow: 0 0 12px var(--text-positive) !important;
                                                }
                                                .animated-status-slider div[role="slider"]:active {
                                                    transform: scale(1.4) !important;
                                                }
                                                .animated-status-slider div[class*="bar-"] {
                                                    height: 6px !important;
                                                    border-radius: 3px !important;
                                                }
                                                .animated-status-slider div[class*="barFill"] {
                                                    background-color: var(--text-positive) !important;
                                                    box-shadow: 0 0 6px rgba(59, 165, 93, 0.3) !important;
                                                }
                                                .animated-status-slider div[class*="markValue"] {
                                                    height: 6px !important;
                                                    margin-top: -3px !important;
                                                }
                                            `}</style>
                                        </div>
                                        <div style={{
                                            position: "relative",
                                            minWidth: "48px",
                                            height: "36px",
                                            marginLeft: "16px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            background: "var(--background-floating)",
                                            borderRadius: "8px",
                                            boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
                                            border: "1px solid var(--background-modifier-accent)"
                                        }}>
                                            <TextInput
                                                value={Math.round(timeout).toString()}
                                                onChange={value => {
                                                    const num = parseInt(value);
                                                    if (!isNaN(num)) {
                                                        const validTime = Math.max(5, Math.min(60, num));
                                                        handleTimeoutChange(validTime);
                                                    }
                                                }}
                                                style={{
                                                    width: "26px",
                                                    textAlign: "right",
                                                    fontWeight: "bold",
                                                    fontSize: "14px",
                                                    background: "transparent",
                                                    border: "none",
                                                    color: "var(--header-primary)",
                                                    padding: "0"
                                                }}
                                            />
                                            <div style={{
                                                marginLeft: "2px",
                                                color: "var(--header-primary)",
                                                fontWeight: "bold",
                                                fontSize: "14px"
                                            }}>
                                                s
                                            </div>
                                        </div>
                                    </Flex>
                                    <div style={{
                                        background: "var(--background-secondary-alt)",
                                        padding: "8px 12px",
                                        borderRadius: "6px",
                                        fontSize: "12px",
                                        color: "var(--text-muted)",
                                        marginTop: "8px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        border: "1px solid var(--background-modifier-accent)"
                                    }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM11 7H13V13H11V7ZM11 15H13V17H11V15Z" fill="currentColor" />
                                        </svg>
                                        Minimum value is 5 seconds to avoid API abuse. Ideal time is 10 seconds.
                                    </div>
                                </div>
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    background: "var(--background-secondary)",
                                    padding: "12px",
                                    borderRadius: "8px",
                                    border: "1px solid var(--background-modifier-accent)"
                                }}>
                                    <div style={{
                                        minWidth: "24px",
                                        height: "24px",
                                        borderRadius: "50%",
                                        background: "var(--brand-experiment-10a)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center"
                                    }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM11 7H13V13H11V7ZM11 15H13V17H11V15Z" fill="var(--brand-experiment)" />
                                        </svg>
                                    </div>
                                    <Forms.FormText style={{
                                        margin: 0,
                                        fontSize: "13px",
                                        lineHeight: "1.3"
                                    }}>
                                        How long each status message will be displayed before changing to the next one. Lower values create a faster animation.
                                    </Forms.FormText>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div style={{
                                background: "var(--background-tertiary)",
                                padding: "20px",
                                borderRadius: "12px",
                                marginBottom: "16px",
                                boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
                                border: "1px solid var(--background-modifier-accent)"
                            }}>
                                <Forms.FormTitle style={{
                                    fontSize: "16px",
                                    fontWeight: 600,
                                    marginBottom: "16px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px"
                                }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M10.59 9.17L5.41 4L4 5.41L9.17 10.58L10.59 9.17ZM14.5 4L16.54 6.04L4 18.59L5.41 20L17.96 7.46L20 9.5V4H14.5ZM14.83 13.41L13.42 14.82L16.55 17.95L14.5 20H20V14.5L17.96 16.54L14.83 13.41Z" fill="currentColor" />
                                    </svg>
                                    Animation Options
                                </Forms.FormTitle>

                                <div style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "12px"
                                }}>
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        padding: "12px 16px",
                                        borderRadius: "8px",
                                        background: "var(--background-secondary)",
                                        transition: "background 0.2s ease",
                                        border: `1px solid ${randomize ? "var(--text-positive)" : "var(--background-modifier-accent)"}`,
                                        boxShadow: randomize ? "0 0 10px rgba(59, 165, 93, 0.15)" : "none",
                                    }}>
                                        <div style={{ flexGrow: 1 }}>
                                            <div style={{
                                                fontSize: "15px",
                                                fontWeight: 600,
                                                marginBottom: "4px",
                                                color: randomize ? "var(--text-positive)" : "var(--header-primary)",
                                            }}>
                                                Randomize Order
                                            </div>
                                            <Forms.FormText style={{ margin: 0, opacity: 0.8 }}>
                                                Shuffle the order of status messages randomly instead of sequential order
                                            </Forms.FormText>
                                        </div>
                                        <div>
                                            <Switch
                                                value={randomize}
                                                onChange={handleRandomizeChange}
                                                style={{
                                                    transform: "scale(1.1)"
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        padding: "12px 16px",
                                        borderRadius: "8px",
                                        background: "var(--background-secondary)",
                                        transition: "background 0.2s ease",
                                        border: `1px solid ${autoStart ? "var(--text-positive)" : "var(--background-modifier-accent)"}`,
                                        boxShadow: autoStart ? "0 0 10px rgba(59, 165, 93, 0.15)" : "none",
                                    }}>
                                        <div style={{ flexGrow: 1 }}>
                                            <div style={{
                                                fontSize: "15px",
                                                fontWeight: 600,
                                                marginBottom: "4px",
                                                color: autoStart ? "var(--text-positive)" : "var(--header-primary)",
                                            }}>
                                                Auto-Start Animation
                                            </div>
                                            <Forms.FormText style={{ margin: 0, opacity: 0.8 }}>
                                                Automatically start animation when Discord loads
                                            </Forms.FormText>
                                        </div>
                                        <div>
                                            <Switch
                                                value={autoStart}
                                                onChange={handleAutoStartChange}
                                                style={{
                                                    transform: "scale(1.1)"
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: "8px" }}>
                            <Forms.FormDivider style={{ marginBottom: "12px" }} />
                            <Forms.FormTitle>Developer</Forms.FormTitle>
                            <div style={{
                                background: "var(--background-tertiary)",
                                padding: "12px",
                                borderRadius: "8px",
                                marginTop: "8px"
                            }}>
                                <Flex direction={Flex.Direction.HORIZONTAL} align={Flex.Align.CENTER}>
                                    <div style={{
                                        width: "32px",
                                        height: "32px",
                                        borderRadius: "50%",
                                        overflow: "hidden",
                                        marginRight: "12px",
                                        border: "2px solid var(--brand-experiment)"
                                    }}>
                                        <img
                                            src="https://github.com/shxdes69.png"
                                            alt="shxdes69"
                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                            onError={e => {
                                                e.currentTarget.src = "https://cdn.discordapp.com/embed/avatars/0.png";
                                            }}
                                        />
                                    </div>
                                    <div style={{ flexGrow: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-normal)" }}>shxdes69</div>
                                        <Flex direction={Flex.Direction.HORIZONTAL} style={{ gap: "12px", marginTop: "4px" }}>
                                            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                                                <span style={{ color: "var(--text-link)", cursor: "pointer" }}
                                                    onClick={e => {
                                                        e.preventDefault();
                                                        window.open("https://github.com/shxdes69/", "_blank", "noopener,noreferrer");
                                                    }}
                                                >
                                                    GitHub
                                                    <svg width="12" height="12" viewBox="0 0 24 24" style={{ verticalAlign: "middle", marginLeft: "3px" }}>
                                                        <path fill="currentColor" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.09.682-.217.682-.48 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.841-2.337 4.687-4.565 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.48C19.137 20.165 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                                                    </svg>
                                                </span>
                                            </div>
                                            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                                                <span style={{ color: "var(--text-link)" }}>
                                                    Discord: shxdes0
                                                </span>
                                            </div>
                                        </Flex>
                                    </div>
                                </Flex>
                            </div>
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
    },
    autoStart: {
        type: OptionType.BOOLEAN,
        description: "Auto-start animation when Discord loads",
        default: true
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


function AnimatedStatusButton() {
    const isRunning = !!statusInterval;

    return (
        <Tooltip text={isRunning ? "Stop Animation" : "Animated Status Settings"}>
            {({ onMouseEnter, onMouseLeave }) => (
                <div
                    className="vc-animated-status-account-btn"
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                    onClick={() => {
                        if (isRunning) {
                            const plugin = window.Vencord?.Plugins?.plugins?.AnimatedStatus as unknown as {
                                stop?: () => void;
                                startAnimation?: (category?: string) => Promise<void>;
                            };
                            plugin?.stop?.();
                        } else {
                            openModal(props => (
                                <ModalRoot {...props} size={ModalSize.MEDIUM}>
                                    <ModalContent>
                                        <AnimatedStatusSettings />
                                    </ModalContent>
                                </ModalRoot>
                            ));
                        }
                    }}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "32px",
                        height: "32px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        color: isRunning ? "var(--text-positive)" : "var(--interactive-normal)",
                        backgroundColor: isRunning ? "var(--background-modifier-selected)" : "transparent",
                        transition: "all 0.2s ease"
                    }}
                    data-running={isRunning}
                >
                    <StatusIcon />
                </div>
            )}
        </Tooltip>
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
    dependencies: ["UserSettingsAPI"],
    settingsPostComponent: () => (
        <div style={{ marginTop: "20px", padding: "20px", background: "var(--background-secondary)", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)" }}>
            <Flex direction={Flex.Direction.HORIZONTAL} align={Flex.Align.CENTER} style={{ marginBottom: "12px" }}>
                <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    marginRight: "12px",
                    border: "2px solid var(--brand-experiment)"
                }}>
                    <img
                        src="https://github.com/shxdes69.png"
                        alt="shxdes69"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={e => {
                            e.currentTarget.src = "https://cdn.discordapp.com/embed/avatars/0.png";
                        }}
                    />
                </div>
                <Forms.FormTitle style={{ margin: 0 }}>Plugin Developer</Forms.FormTitle>
            </Flex>

            <div style={{
                background: "var(--background-tertiary)",
                padding: "12px 16px",
                borderRadius: "8px",
                border: "1px solid var(--background-modifier-accent)"
            }}>
                <Flex direction={Flex.Direction.VERTICAL} style={{ gap: "10px" }}>
                    <div>
                        <Forms.FormText>
                            <strong>Discord:</strong> <span style={{ color: "var(--text-link)" }}>shxdes0</span> <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>(ID: 705545572299571220)</span>
                        </Forms.FormText>
                    </div>
                    <div>
                        <Forms.FormText>
                            <strong>GitHub:</strong> <a
                                href="https://github.com/shxdes69/"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: "var(--text-link)", textDecoration: "none", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "4px" }}
                                onClick={e => {
                                    e.preventDefault();
                                    window.open("https://github.com/shxdes69/", "_blank", "noopener,noreferrer");
                                }}
                            >
                                @shxdes69
                                <svg width="14" height="14" viewBox="0 0 24 24" style={{ marginLeft: "2px" }}>
                                    <path fill="currentColor" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.09.682-.217.682-.48 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.841-2.337 4.687-4.565 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.48C19.137 20.165 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                                </svg>
                            </a>
                        </Forms.FormText>
                    </div>
                </Flex>
            </div>
        </div>
    ),
    patches: [
        {
            find: "#{intl::ACCOUNT_SPEAKING_WHILE_MUTED}",
            replacement: {
                match: /className:\i\.buttons,.{0,50}children:\[/,
                replace: "$&$self.AnimatedStatusButton(),"
            }
        }
    ],

    AnimatedStatusButton: ErrorBoundary.wrap(AnimatedStatusButton, { noop: true }),

    StatusIcon,

    isRunning() {
        return !!statusInterval;
    },

    start() {
        if (settings.store.autoStart) {
            setTimeout(() => {
                this.startAnimation().catch(() => { });
            }, 3000);
        }
    },
    stop() {
        if (statusInterval) {
            clearInterval(statusInterval as NodeJS.Timeout);
            statusInterval = null;
        }
    },
    async startAnimation(category?: string) {
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
            const filteredAnimation = category
                ? animation.filter(step => step.category === category)
                : animation;

            if (filteredAnimation.length === 0) {
                Toasts.show({
                    message: `No status messages in "${category}" category!`,
                    type: Toasts.Type.FAILURE,
                    id: Toasts.genId()
                });
                return;
            }

            if (statusInterval) {
                clearInterval(statusInterval);
                statusInterval = null;
            }

            currentIndex = 0;

            let initialSetSuccess = false;
            for (let retry = 0; retry < 3; retry++) {
                try {
                    await this.setStatus(filteredAnimation[0]);
                    initialSetSuccess = true;
                    break;
                } catch {
                    if (retry === 2) throw new Error("Failed to set initial status");
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            if (!initialSetSuccess) throw new Error("Failed to set initial status after multiple attempts");

            const intervalTime = Math.max(settings.store.timeout * 1000, 5000);
            statusInterval = setInterval(() => {
                try {
                    this.updateStatus(category).catch(() => { });
                } catch {
                    if (statusInterval) {
                        clearInterval(statusInterval);
                        statusInterval = null;
                    }
                }
            }, intervalTime);
            Toasts.show({
                message: "Status animation started!",
                type: Toasts.Type.SUCCESS,
                id: Toasts.genId()
            });
        } catch {
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
    async setStatus(statusObj: any) {
        try {
            if (!CustomStatus) return { success: false, error: "CustomStatus setting not available" };

            let emojiId = statusObj.emoji_id?.toString() || "0";
            if (emojiId === "") emojiId = "0";

            const createdAtMs = Date.now().toString();
            const expiresAtMs = statusObj.expires_at ? statusObj.expires_at.toString() : "0";

            await CustomStatus.updateSetting({
                text: statusObj.text || "",
                emojiName: statusObj.emoji_name || "",
                emojiId: emojiId,
                createdAtMs: createdAtMs,
                expiresAtMs: expiresAtMs
            });

            if (statusObj.status && StatusSetting) {
                try {
                    await StatusSetting.updateSetting(statusObj.status);
                } catch { }
            }

            return { success: true };
        } catch (err) {
            return { success: false, error: err };
        }
    },
    async updateStatus(category?: string) {
        try {
            if (Date.now() - (this._lastUpdateTime || 0) < 2000) return;
            this._lastUpdateTime = Date.now();

            const animation = safeParseJSON(settings.store.animation);
            const filteredAnimation = category ? animation.filter(step => step.category === category) : animation;

            if (filteredAnimation.length === 0) {
                if (statusInterval) {
                    clearInterval(statusInterval);
                    statusInterval = null;
                }
                return;
            }

            const nextIndex = settings.store.randomize ? Math.floor(Math.random() * filteredAnimation.length) : (currentIndex + 1) % filteredAnimation.length;
            currentIndex = nextIndex;

            let retries = 3;
            while (retries > 0) {
                try {
                    await this.setStatus(filteredAnimation[currentIndex]);
                    break;
                } catch {
                    retries--;
                    if (retries <= 0) throw new Error("Failed to update status");
                    await new Promise(resolve => setTimeout(resolve, (4 - retries) * 500));
                }
            }
        } catch {
            if (statusInterval) {
                clearInterval(statusInterval as NodeJS.Timeout);
                statusInterval = null;
            }
            Toasts.show({
                message: "Status animation stopped due to an error",
                type: Toasts.Type.FAILURE,
                id: Toasts.genId()
            });
        }
    },
    updateInterval(newTimeout: number) {
        if (!statusInterval) return;
        clearInterval(statusInterval);
        const intervalTime = Math.max(newTimeout * 1000, 5000);
        statusInterval = setInterval(() => {
            try {
                this.updateStatus().catch(() => { });
            } catch {
                if (statusInterval) {
                    clearInterval(statusInterval);
                    statusInterval = null;
                }
            }
        }, intervalTime);
    }
});
