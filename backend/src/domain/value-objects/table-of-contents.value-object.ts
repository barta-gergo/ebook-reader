/**
 * Value Object representing a table of contents entry
 */
export class TocEntry {
  constructor(
    public readonly title: string,
    public readonly page: number,
    public readonly level: number,
    public readonly children: TocEntry[] = [],
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.title?.trim()) {
      throw new Error('TOC entry title cannot be empty');
    }
    if (this.page < 0) {
      throw new Error('TOC entry page cannot be negative');
    }
    if (this.level < 0) {
      throw new Error('TOC entry level cannot be negative');
    }
  }

  public static create(title: string, page: number, level: number = 0): TocEntry {
    return new TocEntry(title, page, level);
  }

  public addChild(child: TocEntry): TocEntry {
    return new TocEntry(this.title, this.page, this.level, [...this.children, child]);
  }

  public hasChildren(): boolean {
    return this.children.length > 0;
  }

  public equals(other: TocEntry): boolean {
    return (
      this.title === other.title &&
      this.page === other.page &&
      this.level === other.level &&
      this.children.length === other.children.length &&
      this.children.every((child, index) => child.equals(other.children[index]))
    );
  }
}

/**
 * Value Object representing the complete table of contents for a book
 */
export class TableOfContents {
  private readonly _entries: TocEntry[];

  constructor(entries: TocEntry[] = []) {
    this._entries = [...entries];
  }

  public static empty(): TableOfContents {
    return new TableOfContents();
  }

  public static create(entries: TocEntry[]): TableOfContents {
    return new TableOfContents(entries);
  }

  public getEntries(): TocEntry[] {
    return [...this._entries];
  }

  public isEmpty(): boolean {
    return this._entries.length === 0;
  }

  public getEntryCount(): number {
    return this._entries.length;
  }

  public findEntryByPage(page: number): TocEntry | null {
    for (const entry of this._entries) {
      if (entry.page === page) {
        return entry;
      }
      
      // Search in children recursively
      const found = this.findInChildren(entry.children, page);
      if (found) {
        return found;
      }
    }
    return null;
  }

  private findInChildren(children: TocEntry[], page: number): TocEntry | null {
    for (const child of children) {
      if (child.page === page) {
        return child;
      }
      const found = this.findInChildren(child.children, page);
      if (found) {
        return found;
      }
    }
    return null;
  }

  public getMaxLevel(): number {
    return this._entries.reduce((max, entry) => {
      const entryMax = this.getMaxLevelInEntry(entry);
      return Math.max(max, entryMax);
    }, 0);
  }

  private getMaxLevelInEntry(entry: TocEntry): number {
    let max = entry.level;
    for (const child of entry.children) {
      max = Math.max(max, this.getMaxLevelInEntry(child));
    }
    return max;
  }

  public equals(other: TableOfContents): boolean {
    return (
      this._entries.length === other._entries.length &&
      this._entries.every((entry, index) => entry.equals(other._entries[index]))
    );
  }

  public toString(): string {
    return JSON.stringify(this._entries.map(entry => ({
      title: entry.title,
      page: entry.page,
      level: entry.level,
      hasChildren: entry.hasChildren(),
    })));
  }
}