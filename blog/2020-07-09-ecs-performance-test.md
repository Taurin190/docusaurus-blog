---
slug: 'ECSで大量アクセスのストレステストを実施した'
title: ECSで大量アクセスのストレステストを実施した
tags: [AWS, ECS, Performance Test]
---
パフォーマンス改善のプロジェクトにおいて、AWSのElastic Container Service(ECS)を用いて ストレステストを実施しました。 一つの方法として良かった部分もあったので備忘録としてまとめます。

<!--truncate-->
## ストレステスト環境としてECSを利用する
ECSはAWSのフルマネージド型のコンテナオーケストレーションサービスで、 Kubernetesの管理を意識せずにコンテナの実行できる環境です。

検証の途中で棄却されたのですが、 単一のIPアドレスから送信される場合には問題が起こらないが、大量のユーザが異なるIPアドレスからリクエストをかけることによりパフォーマンスが低下を招いているのでないかという仮説があり、ECSとFargateでのテスト実施により大量のIPからのリクエストを実施できるのでないかと考えました。

ECS, Fargateにはawsvpcネットワークモードというネットワーキングプロパティがあり、 コンテナを実行するタスク毎にprivateのIPアドレスが付与されます。

privateのIPなのでネットワークの外では使えないですが、 Virtual Private Cloud(VPC)内やVPC間を繋いで通信する分には、大量のユーザのアクセスを再現できると考えました。


## ECSとFargateについて
ECSにはEC2とFargateという選択肢があり、管理する範囲が異なります。 EC2では、自分たちでKubernetesのノードとなるインスタンスを用意する必要があり、 Fargateでは、ノードもAWSで管理されているため用意する必要がありません。

包含関係で言うと、ECSの中にEC2とFargateと選択できるのですが、 EC2と呼称するとComputeサービスと分かりにくくなるため、ノードに独自管理のEC2使用するものをECSとして書きます。

当初はFargateの方が管理することも無く使いやすそうなので使用を検討していました。 コストも実行した分のみなので短時間実施してすぐに止めれば大量にコンテナを用意したとしても問題ないかと考えていました。

しかし、Fargate検討時に以下の問題にぶつかり使用を断念しました。

- defaultの制限が100までである
- 起動毎にDockerコンテナのpullが行われ、2分程度かけてコンテナが10程度ずつ作られるため大量の作成すると時間がかかる

制限に関しては、サポートに相談し上げてもらうことも可能かと思いますが、 起動時間がかかり過ぎてしまうと、一度にリクエストをサービスにかけるためにコンテナ内で待機させる必要があり、待機時間によりコストメリットが薄くなりました。

起動時間が遅いの一つの理由に、 マネージされたノードを使用していて毎回Dockerのpullが行われているためという理由がありました。

そこで、ノードを独自で管理するECSで、コンテナpull時のキャッシュする設定を追加して試しました。


## ECSの環境準備
ECSクラスター作成画面にて、「EC2 Linux + ネットワーキング」を選択し、名前と使用するVPC入力してすると、ノードのインスタンス、コンテナのIAM、構成設定のCloudFormationスタックを作成してくれる。

このままでは、ノードがDockerのイメージをキャッシュしてくれないので、ノードがコンテナをキャッシュする設定を書き込む必要がある。

もっと良いやり方はあるかもしれませんが、以下の手順で行いました。

1. CloudFormationで作成されたノードインスタンスのAMIを作成
1. ノードのAMIを元にEC2からインスタンスを作成を進める
1. 起動を進める中で、インスタンスの設定の高度な設定において以下のbashでを書き込む

        #!/bin/bash echo ECS_CLUSTER=stress-test-cluster >> /etc/ecs/ecs.config;
        echo ECS_IMAGE_PULL_BEHAVIOR=always >> /etc/ecs/ecs.config; 
1. ノードを起動後、設定が書き込まれたインスタンスのAMIを作成する
1. 設定が書き込まれたインスタンスAMIを元に起動設定を作成
1. CloudFormationにてノードインスタンス起動用に作成されたAutoScalingGroupの起動設定を作成したものに変更する

AutoScalingグループにてノードを一つ以上用意するとコンテナを作成できるようになります。 ちなみに、起動できるコンテナの数はインスタンスタイプ毎にどれだけIPアドレスを持つことができるかという数字に依存します。ノード自体のIPが必要なので、リンクに記載されている数から１を引いた数が起動できるコンテナの最大数になります。

Dockerコンテナには、Vegetaというgolangで作成されたストレステストツールを使用しました。 コンテナ内で環境変数を読み込み、指定された時間になった時にVegetaでのリクエスト送信を始めます。

## ハマったポイント
- 前述の通り、Fargateは起動に時間がかかり、制限を外さないと100までしか増やせない
  - FargateではDockerのpullを毎回行う
- ECSの１つのノードで起動できるコンテナの数は、CPU/MEMにも依存するが、ノードが持てるネットワークの数に依存して足りなくなる
- 使用できるIPアドレス少ないサブネットで大量にコンテナを作成した場合は、サブネット内のIPアドレスが枯渇する
- コンテナが作成されるのに時差が生じるため、一斉にリクエストを送るためには起動後待つような仕組みが必要
- privateのIPを使用してリクエストをかけることが出来るのはprivateのネットワーク内なので、AWSではinternalのロードバランサーが必要である
- publicのドメインやロードバランサーに対してもNAT Gatewayを介してリクエストを送ることは出来るが、ipアドレスは一意になる

## ECSをストレステストに使用した所感
大量のIPからのリクエストという当初考えていた仮説は外れたため別の方法で検証を進めることも可能であったが、ECSでのストレステストには以下のようなメリットがあった。

- 多少準備に時間がかかるもののスケールが容易にできる
- コンテナを変えればテスト内容やテスト対象を簡単に変えられる

ノード数を増やしコンテナの数を増やせば、大きいリクエストをかけることが出来る。 今回の試行では最大1000コンテナまで増やし10,000qpsまでリクエストをかけました。

jMeterのClusterを用いてリクエストをかけるという方法もあるかと思いますが、 チューニングが大変であり、経験としてスクリプトのスタートを上手く同期できないという問題も当たったこともありました。

今回紹介したECSを用いた方法では、容易にスケールすることが可能です。また、テストの実行を行うコンテナを変えることでVegetaからjMeterやGatlingに変えてシナリオベースのテストを使うなど柔軟なテストが可能です。

ただ、結果を集積する部分に関しては仕組みを考える必要があり、 私はCloudWatchのメトリックスとログのデータでパフォーマンスを見ましたが、 より良い方法はあるのではないかと思います。

## まとめ
- 大規模のストレステストにECS（Elastic Container Service）を用いて実施した。
- 多少の設定は必要なものの一度クラスタを用意すると水平にスケールと実施内容の変更が簡単に出来る。
- ただし、レスポンスのデータは別途集計して集める必要がある。