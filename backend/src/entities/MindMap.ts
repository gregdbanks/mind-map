import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne, VersionColumn } from 'typeorm'
import { Node } from './Node'
import { CanvasState } from './CanvasState'

@Entity('mind_maps')
export class MindMap {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column()
  title!: string

  @Column({ nullable: true })
  description?: string

  @Column({ nullable: true })
  rootNodeId?: string

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  @VersionColumn()
  version!: number

  @OneToMany(() => Node, node => node.mindMap)
  nodes!: Node[]

  @OneToOne(() => CanvasState, canvasState => canvasState.mindMap)
  canvasState?: CanvasState
}